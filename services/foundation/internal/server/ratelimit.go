package server

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
	"github.com/agbofa/nexus/libs/go/pkg/config"
	"github.com/agbofa/nexus/services/foundation/internal/repositories"
)

type rateRule struct {
	Limit  int
	Window time.Duration
}

func withRateLimit(store *repositories.RateLimitStore, env config.Environment, cfg config.RateLimitConfig, metrics *Metrics) func(http.Handler) http.Handler {
	rules := map[string]rateRule{
		"/rpc/foundation.tenant_identity.v1.TenantIdentityService/AuthenticateUser": {Limit: 30, Window: time.Minute},
		"/rpc/ai.v1.AIGateway/Complete":                                              {Limit: 20, Window: time.Minute},
		"/rpc/social.v1.SocialService/Connect":                                       {Limit: 20, Window: time.Minute},
		"/rpc/social.v1.SocialService/Callback":                                      {Limit: 20, Window: time.Minute},
		"/rpc/social.v1.SocialService/Accounts":                                      {Limit: 60, Window: time.Minute},
		"/rpc/social.v1.SocialService/CreateDistribution":                            {Limit: 10, Window: time.Minute},
		"/rpc/social.v1.SocialService/ListDistributions":                             {Limit: 60, Window: time.Minute},
		"/rpc/publish.v1.PublishingService/Schedule":                                 {Limit: 20, Window: time.Minute},
		"/rpc/publish.v1.PublishingService/Approve":                                  {Limit: 20, Window: time.Minute},
		"/rpc/publish.v1.PublishingService/Cancel":                                   {Limit: 20, Window: time.Minute},
		"/rpc/publish.v1.PublishingService/Get":                                      {Limit: 60, Window: time.Minute},
		"/rpc/publish.v1.PublishingService/Tick":                                     {Limit: 6, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/GetControl":                                {Limit: 60, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/Execute":                                   {Limit: 20, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/GetExecution":                              {Limit: 60, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/KillSwitch":                                {Limit: 10, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/SetLevel":                                  {Limit: 20, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/CreatePolicy":                              {Limit: 10, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/RequestApproval":                           {Limit: 20, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/DecideApproval":                            {Limit: 20, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/SimulateRun":                               {Limit: 20, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/ListRuns":                                  {Limit: 60, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/CreateMemory":                              {Limit: 20, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/ListMemories":                              {Limit: 60, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/ApplyMemoryAsPrivilege":                    {Limit: 10, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/CreateScenario":                            {Limit: 20, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/ListScenarios":                             {Limit: 60, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/Usage":                                     {Limit: 60, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/Routing":                                   {Limit: 30, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/Strategies":                                {Limit: 60, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/ListAgents":                                {Limit: 60, Window: time.Minute},
		"/rpc/autonomy.v1.AutonomyService/EnableAgent":                               {Limit: 20, Window: time.Minute},
		"/v1/autonomy/execute":                                                       {Limit: 20, Window: time.Minute},
	}
	if !cfg.Enabled {
		return func(next http.Handler) http.Handler { return next }
	}
	failClosed := cfg.FailClosed
	if env.Strict() && !failClosed {
		failClosed = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			rule, ok := rules[r.URL.Path]
			if !ok || store == nil {
				next.ServeHTTP(w, r)
				return
			}
			tenantID, scope := requestScope(r)
			decision, err := store.Allow(r.Context(), tenantID, scope, rule.Limit, rule.Window)
			if err != nil {
				if metrics != nil {
					metrics.Inc("rate_limit_errors_total")
				}
				log.Printf("rate_limit error path=%s tenant=%s err=%v", r.URL.Path, tenantID, err)
				if failClosed {
					writeError(w, http.StatusServiceUnavailable, "rate_limit_unavailable")
					return
				}
				next.ServeHTTP(w, r)
				return
			}
			remaining := decision.Limit - decision.Count
			if remaining < 0 {
				remaining = 0
			}
			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", decision.Limit))
			w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
			if !decision.ResetAt.IsZero() {
				w.Header().Set("X-RateLimit-Reset", decision.ResetAt.UTC().Format(time.RFC3339))
			}
			if !decision.Allowed {
				if metrics != nil {
					metrics.Inc("rate_limit_denied_total")
					metrics.Inc("rate_limit_denied_total|path=" + sanitizeMetricLabel(r.URL.Path))
				}
				retryAfter := int(decision.RetryAfter.Round(time.Second) / time.Second)
				if retryAfter < 1 {
					retryAfter = 1
				}
				w.Header().Set("Retry-After", fmt.Sprintf("%d", retryAfter))
				principal, _ := authz.PrincipalFrom(r.Context())
				log.Printf("rate_limit deny path=%s tenant=%s subject=%s retry_after=%ds", r.URL.Path, principal.TenantID, principal.SubjectID, retryAfter)
				writeJSON(w, http.StatusTooManyRequests, map[string]any{
					"error":       "rate_limited",
					"status":      http.StatusTooManyRequests,
					"retry_after": retryAfter,
					"ts":          time.Now().UTC().Format(time.RFC3339),
				})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func requestScope(r *http.Request) (tenantID, scopeKey string) {
	principal, ok := authz.PrincipalFrom(r.Context())
	if ok && principal.SubjectID != "" && principal.TenantID != "" {
		raw := fmt.Sprintf("path=%s|tenant=%s|subject=%s", r.URL.Path, principal.TenantID, principal.SubjectID)
		return principal.TenantID, hashedScope(r.URL.Path, raw)
	}
	anon := anonymousIdentity(r)
	raw := fmt.Sprintf("path=%s|anon=%s", r.URL.Path, anon)
	return "", hashedScope(r.URL.Path, raw)
}

func anonymousIdentity(r *http.Request) string {
	if r.URL.Path == "/rpc/foundation.tenant_identity.v1.TenantIdentityService/AuthenticateUser" && r.Body != nil {
		body, err := io.ReadAll(r.Body)
		if err == nil {
			_ = r.Body.Close()
			r.Body = io.NopCloser(bytes.NewReader(body))
			var req struct {
				TenantName    string `json:"tenant_name"`
				PrincipalName string `json:"principal_name"`
			}
			if json.Unmarshal(body, &req) == nil {
				parts := []string{
					strings.TrimSpace(strings.ToLower(req.TenantName)),
					strings.TrimSpace(strings.ToLower(req.PrincipalName)),
					strings.TrimSpace(strings.ToLower(r.Header.Get("User-Agent"))),
				}
				joined := strings.Join(parts, "|")
				if strings.Trim(joined, "|") != "" {
					return joined
				}
			}
		}
	}
	return strings.TrimSpace(strings.ToLower(r.Header.Get("User-Agent")))
}

func hashedScope(prefix, raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return prefix + ":" + hex.EncodeToString(sum[:16])
}
