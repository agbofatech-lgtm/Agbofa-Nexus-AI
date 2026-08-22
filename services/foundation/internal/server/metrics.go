package server

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
)

type Metrics struct {
	mu       sync.Mutex
	start    time.Time
	inflight int64
	counts   map[string]uint64
}

func NewMetrics() *Metrics {
	return &Metrics{start: time.Now().UTC(), counts: map[string]uint64{}}
}

func (m *Metrics) Inc(name string) {
	m.Add(name, 1)
}

func (m *Metrics) Add(name string, n uint64) {
	if m == nil || name == "" {
		return
	}
	m.mu.Lock()
	m.counts[name] += n
	m.mu.Unlock()
}

func (m *Metrics) begin() {
	if m == nil {
		return
	}
	m.mu.Lock()
	m.inflight++
	m.mu.Unlock()
}

func (m *Metrics) end() {
	if m == nil {
		return
	}
	m.mu.Lock()
	m.inflight--
	if m.inflight < 0 {
		m.inflight = 0
	}
	m.mu.Unlock()
}

func (m *Metrics) Snapshot() map[string]any {
	if m == nil {
		return map[string]any{"available": false}
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	counts := make(map[string]uint64, len(m.counts))
	for k, v := range m.counts {
		counts[k] = v
	}
	return map[string]any{
		"available":        true,
		"started_at":       m.start.Format(time.RFC3339),
		"uptime_seconds":   int64(time.Since(m.start).Seconds()),
		"inflight_requests": m.inflight,
		"counters":         counts,
	}
}

type statusRecorder struct {
	http.ResponseWriter
	status int
	wrote  bool
}

func (r *statusRecorder) WriteHeader(status int) {
	if r.wrote {
		return
	}
	r.status = status
	r.wrote = true
	r.ResponseWriter.WriteHeader(status)
}

func (r *statusRecorder) Write(b []byte) (int, error) {
	if !r.wrote {
		r.WriteHeader(http.StatusOK)
	}
	return r.ResponseWriter.Write(b)
}

func withObservability(metrics *Metrics) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now().UTC()
			metrics.begin()
			defer metrics.end()
			rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(rec, r)
			principal, _ := authz.PrincipalFrom(r.Context())
			statusClass := fmt.Sprintf("%dxx", rec.status/100)
			pathKey := sanitizeMetricLabel(r.URL.Path)
			metrics.Inc("http_requests_total")
			metrics.Inc("http_requests_total|path=" + pathKey + "|status=" + statusClass)
			metrics.Add("http_request_duration_ms_total|path="+pathKey, uint64(time.Since(start).Milliseconds()))
			if rec.status >= 500 {
				metrics.Inc("http_errors_total")
			}
			log.Printf("http complete method=%s path=%s status=%d duration_ms=%d correlation_id=%s tenant=%s subject=%s",
				r.Method,
				r.URL.Path,
				rec.status,
				time.Since(start).Milliseconds(),
				r.Header.Get("X-Correlation-ID"),
				principal.TenantID,
				principal.SubjectID,
			)
		})
	}
}

func sanitizeMetricLabel(v string) string {
	v = strings.TrimSpace(v)
	if v == "" {
		return "root"
	}
	replacer := strings.NewReplacer("/", "_", "-", "_", ".", "_", " ", "_")
	v = replacer.Replace(v)
	for strings.Contains(v, "__") {
		v = strings.ReplaceAll(v, "__", "_")
	}
	return strings.Trim(v, "_")
}
