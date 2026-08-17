package application

import (
	"context"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockDetectorAgent struct {
	id         string
	tenantID   string
	confidence float64
	err        error
}

func (m *mockDetectorAgent) ID() string                 { return m.id }
func (m *mockDetectorAgent) Name() string               { return "Mock Detector" }
func (m *mockDetectorAgent) TenantID() string           { return m.tenantID }
func (m *mockDetectorAgent) Status() domain.AgentStatus { return domain.AgentStatusActive }
func (m *mockDetectorAgent) Detect(ctx context.Context, signal domain.MonitorSignal) (*domain.DetectionResult, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.DetectionResult{
		ResultID:        "res-mock-orch",
		TenantID:        m.tenantID,
		SignalID:        signal.SignalID,
		DetectorID:      m.id,
		DetectorName:    "Mock Detector",
		Classification:  "BREAKING_NEWS",
		ConfidenceScore: m.confidence,
		DetectedAt:      time.Now(),
	}, nil
}
func (m *mockDetectorAgent) Confidence() float64       { return m.confidence }
func (m *mockDetectorAgent) Evidence() []domain.EvidenceItem { return nil }
func (m *mockDetectorAgent) Execute(ctx context.Context, executionContext map[string]string) error {
	return nil
}

type mockDetectorPublisher struct {
	resultEvents int
}

func (m *mockDetectorPublisher) PublishSignalDetected(ctx context.Context, event *domain.MonitorSignalDetectedEvent) error {
	return nil
}
func (m *mockDetectorPublisher) PublishTrendingTopic(ctx context.Context, event *domain.TrendingTopicFoundEvent) error {
	return nil
}
func (m *mockDetectorPublisher) PublishDetectionResult(ctx context.Context, event *domain.DetectionResultReadyEvent) error {
	m.resultEvents++
	return nil
}

func TestDetectorOrchestratorExecuteDetectionAndEVT020(t *testing.T) {
	tenantID := "tenant-orch-test"
	detector := &mockDetectorAgent{
		id:         "AGT-009",
		tenantID:   tenantID,
		confidence: 0.96,
	}
	publisher := &mockDetectorPublisher{}

	orch := NewDetectorOrchestrator(publisher, nil)
	req := DetectionRequestDTO{
		TenantID: tenantID,
		AgentID:  "AGT-009",
		Signal:   domain.MonitorSignal{SignalID: "sig-99", TenantID: tenantID},
	}

	resp, err := orch.ExecuteDetection(context.Background(), detector, req)
	if err != nil {
		t.Fatalf("expected execute detection success, got %v", err)
	}
	if resp.Result.ConfidenceScore != 0.96 || resp.Result.Classification != "BREAKING_NEWS" {
		t.Fatalf("unexpected detection response: %v", resp)
	}
	if publisher.resultEvents != 1 {
		t.Fatalf("expected 1 EVT-020 published event, got %d", publisher.resultEvents)
	}
}

func TestDetectorOrchestratorExecuteBatchDetection(t *testing.T) {
	tenantID := "tenant-orch-test"
	detector := &mockDetectorAgent{
		id:         "AGT-010",
		tenantID:   tenantID,
		confidence: 0.91,
	}
	publisher := &mockDetectorPublisher{}

	orch := NewDetectorOrchestrator(publisher, nil)
	req := BatchDetectionRequestDTO{
		TenantID: tenantID,
		AgentID:  "AGT-010",
		Signals: []domain.MonitorSignal{
			{SignalID: "s-1", TenantID: tenantID},
			{SignalID: "s-2", TenantID: tenantID},
		},
	}

	resp, err := orch.ExecuteBatchDetection(context.Background(), detector, req)
	if err != nil {
		t.Fatalf("expected batch detection success, got %v", err)
	}
	if resp.ResultsCount != 2 || len(resp.Results) != 2 {
		t.Fatalf("expected 2 batch results, got %d", resp.ResultsCount)
	}
	// 2 individual results + 1 arbitrated batch result = 3 EVT-020 events
	if publisher.resultEvents != 3 {
		t.Fatalf("expected 3 published EVT-020 events, got %d", publisher.resultEvents)
	}
}

func TestDetectorConflictArbitrationRules(t *testing.T) {
	tenantID := "tenant-alpha"
	orch := NewDetectorOrchestrator(nil, nil)

	// Rule 1: AGT-015 duplicate override (> 0.90 similarity)
	dupResults := []domain.DetectionResult{
		{DetectorID: "AGT-009", TenantID: tenantID, Classification: "BREAKING_NEWS", ConfidenceScore: 0.95},
		{DetectorID: "AGT-015", TenantID: tenantID, Classification: "DUPLICATE", ConfidenceScore: 0.93},
	}
	arb1, err := orch.ArbitrateDetections(context.Background(), tenantID, "sig-dup", dupResults)
	if err != nil || arb1.Classification != "DUPLICATE" {
		t.Fatalf("expected AGT-015 duplicate override, got %v (%v)", arb1, err)
	}

	// Rule 2: BREAKING_NEWS + VIRALITY_FORECAST -> compatible, merge with multiplicative boost
	compatResults := []domain.DetectionResult{
		{DetectorID: "AGT-009", TenantID: tenantID, Classification: "BREAKING_NEWS", ConfidenceScore: 0.80},
		{DetectorID: "AGT-016", TenantID: tenantID, Classification: "VIRALITY_FORECAST", ConfidenceScore: 0.82},
	}
	arb2, err := orch.ArbitrateDetections(context.Background(), tenantID, "sig-compat", compatResults)
	if err != nil || arb2.Classification != "BREAKING_NEWS_VIRAL" {
		t.Fatalf("expected BREAKING_NEWS_VIRAL classification, got %s", arb2.Classification)
	}

	// Rule 3: AMBIGUOUS when confidence difference < 0.20 for contradictory labels
	ambigResults := []domain.DetectionResult{
		{DetectorID: "AGT-010", TenantID: tenantID, Classification: "VIRAL_TREND", ConfidenceScore: 0.85},
		{DetectorID: "AGT-013", TenantID: tenantID, Classification: "MULTIMEDIA_CONTENT", ConfidenceScore: 0.82},
	}
	arb3, err := orch.ArbitrateDetections(context.Background(), tenantID, "sig-ambig", ambigResults)
	if err != nil || arb3.Metadata["arbitration_status"] != "AMBIGUOUS" {
		t.Fatalf("expected AMBIGUOUS arbitration status when scores within 0.20, got %s", arb3.Metadata["arbitration_status"])
	}
}
