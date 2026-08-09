package detectors

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockContentDetector struct {
	id          string
	name        string
	tenantID    string
	initialized bool
	shutdown    bool
}

func (m *mockContentDetector) ID() string       { return m.id }
func (m *mockContentDetector) Name() string     { return m.name }
func (m *mockContentDetector) TenantID() string { return m.tenantID }
func (m *mockContentDetector) Version() string  { return "1.0.0" }

func (m *mockContentDetector) Initialize(ctx context.Context, tenantID string, config map[string]string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	m.tenantID = tenantID
	m.initialized = true
	return nil
}

func (m *mockContentDetector) HealthCheck(ctx context.Context) (*domain.SourceHealth, error) {
	status := "ONLINE"
	if !m.initialized {
		status = "DEGRADED"
	}
	return &domain.SourceHealth{
		SourceID:    m.id,
		TenantID:    m.tenantID,
		Status:      status,
		LastCheckAt: time.Now(),
		LatencyMs:   4,
	}, nil
}

func (m *mockContentDetector) Shutdown(ctx context.Context) error {
	m.shutdown = true
	return nil
}

func (m *mockContentDetector) Detect(ctx context.Context, signal *domain.MonitorSignal) (*domain.DetectionResult, error) {
	if signal == nil || signal.TenantID == "" || (m.tenantID != "" && m.tenantID != signal.TenantID) {
		return nil, domain.ErrCrossTenantViolation
	}
	return &domain.DetectionResult{
		ResultID:        "res-" + m.id,
		TenantID:        signal.TenantID,
		SignalID:        signal.SignalID,
		DetectorID:      m.id,
		DetectorName:    m.name,
		Classification:  "BREAKING_NEWS",
		ConfidenceScore: 0.92,
		DetectedAt:      time.Now(),
	}, nil
}

func (m *mockContentDetector) Analyze(ctx context.Context, signal *domain.MonitorSignal) (*domain.DetectionResult, error) {
	return m.Detect(ctx, signal)
}

func (m *mockContentDetector) Classify(ctx context.Context, signal *domain.MonitorSignal) (string, float64, []domain.EvidenceItem, error) {
	return "BREAKING_NEWS", 0.92, nil, nil
}

func TestDetectorRegistry_LifecycleAndConcurrentDetection(t *testing.T) {
	ctx := context.Background()
	reg := NewDetectorRegistry()

	d1 := &mockContentDetector{id: "AGT-009", name: "Breaking News Detector"}
	d2 := &mockContentDetector{id: "AGT-010", name: "Trend Identifier"}

	if err := reg.RegisterDetector(d1); err != nil {
		t.Fatalf("unexpected error registering d1: %v", err)
	}
	if err := reg.RegisterDetector(d2); err != nil {
		t.Fatalf("unexpected error registering d2: %v", err)
	}

	// 1. Cross-tenant InitializeAll check
	err := reg.InitializeAll(ctx, "", nil)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenantID, got %v", err)
	}

	// 2. Valid InitializeAll
	if err := reg.InitializeAll(ctx, "tenant-b1", nil); err != nil {
		t.Fatalf("unexpected error initializing detectors: %v", err)
	}

	// 3. HealthCheckAll
	healthMap, err := reg.HealthCheckAll(ctx)
	if err != nil || len(healthMap) != 2 {
		t.Fatalf("expected 2 health check entries, got len=%d err=%v", len(healthMap), err)
	}
	if healthMap["AGT-009"].Status != "ONLINE" {
		t.Errorf("expected ONLINE status for AGT-009, got %s", healthMap["AGT-009"].Status)
	}

	// 4. Concurrent DetectAll
	signal := &domain.MonitorSignal{
		SignalID: "sig-100",
		TenantID: "tenant-b1",
		Content:  "Breaking: Agbofa Nexus AI detector registry coordinates concurrent detection.",
	}

	results, err := reg.DetectAll(ctx, signal)
	if err != nil || len(results) != 2 {
		t.Fatalf("expected 2 detection results from DetectAll, got len=%d err=%v", len(results), err)
	}

	// 5. ShutdownAll
	if err := reg.ShutdownAll(ctx); err != nil {
		t.Fatalf("unexpected error shutting down: %v", err)
	}
	if !d1.shutdown || !d2.shutdown {
		t.Errorf("expected all detectors shutdown")
	}
}
