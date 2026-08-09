package application

import (
	"context"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockVerifierAgent struct {
	id         string
	tenantID   string
	confidence float64
	err        error
}

func (m *mockVerifierAgent) ID() string                 { return m.id }
func (m *mockVerifierAgent) Name() string               { return "Mock Verifier" }
func (m *mockVerifierAgent) TenantID() string           { return m.tenantID }
func (m *mockVerifierAgent) Status() domain.VerificationStatus {
	return domain.VerificationStatusVerified
}
func (m *mockVerifierAgent) Verify(ctx context.Context, detection domain.DetectionResult) (*domain.VerificationResult, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.VerificationResult{
		VerificationID:    "ver-mock-orch",
		TenantID:          m.tenantID,
		SignalID:          detection.SignalID,
		DetectionID:       detection.ResultID,
		AgentID:           m.id,
		AgentName:         "Mock Verifier",
		Status:            domain.VerificationStatusVerified,
		ConfidenceScore:   m.confidence,
		UncertaintyMetric: 1.0 - m.confidence,
		VerifiedAt:        time.Now(),
	}, nil
}
func (m *mockVerifierAgent) Confidence() float64       { return m.confidence }
func (m *mockVerifierAgent) Evidence() []domain.EvidenceItem { return nil }
func (m *mockVerifierAgent) Execute(ctx context.Context, executionContext map[string]string) error {
	return nil
}

type mockScoringAgent struct {
	id       string
	tenantID string
}

func (m *mockScoringAgent) AggregateConfidence(ctx context.Context, tenantID string, results []domain.VerificationResult) (*domain.VerificationResult, error) {
	return &domain.VerificationResult{
		VerificationID:    "ver-agg-mock",
		TenantID:          tenantID,
		SignalID:          results[0].SignalID,
		DetectionID:       results[0].DetectionID,
		AgentID:           "AGT-024",
		AgentName:         "Confidence Scoring",
		Status:            domain.VerificationStatusVerified,
		ConfidenceScore:   0.88,
		UncertaintyMetric: 0.12,
		VerifiedAt:        time.Now(),
	}, nil
}

type mockVerificationPublisher struct {
	verifEvents int
}

func (m *mockVerificationPublisher) PublishSignalDetected(ctx context.Context, event *domain.MonitorSignalDetectedEvent) error {
	return nil
}
func (m *mockVerificationPublisher) PublishTrendingTopic(ctx context.Context, event *domain.TrendingTopicFoundEvent) error {
	return nil
}
func (m *mockVerificationPublisher) PublishDetectionResult(ctx context.Context, event *domain.DetectionResultReadyEvent) error {
	return nil
}
func (m *mockVerificationPublisher) PublishVerificationCompleted(ctx context.Context, event *domain.VerificationCompletedEvent) error {
	m.verifEvents++
	return nil
}

func TestVerificationOrchestratorExecuteVerificationAndEVT021(t *testing.T) {
	tenantID := "tenant-orch-test"
	verifier := &mockVerifierAgent{
		id:         "AGT-017",
		tenantID:   tenantID,
		confidence: 0.95,
	}
	publisher := &mockVerificationPublisher{}

	orch := NewVerificationOrchestrator(publisher, nil)
	req := VerificationRequestDTO{
		TenantID:  tenantID,
		AgentID:   "AGT-017",
		Detection: domain.DetectionResult{ResultID: "det-99", TenantID: tenantID, SignalID: "sig-99"},
	}

	resp, err := orch.ExecuteVerification(context.Background(), verifier, req)
	if err != nil {
		t.Fatalf("expected execute verification success, got %v", err)
	}
	if resp.Result.ConfidenceScore != 0.95 || resp.Result.Status != domain.VerificationStatusVerified {
		t.Fatalf("unexpected verification response: %v", resp)
	}
	if publisher.verifEvents != 1 {
		t.Fatalf("expected 1 EVT-021 published event, got %d", publisher.verifEvents)
	}
}

func TestVerificationOrchestratorExecuteBatchVerification(t *testing.T) {
	tenantID := "tenant-orch-test"
	verifier := &mockVerifierAgent{
		id:         "AGT-018",
		tenantID:   tenantID,
		confidence: 0.90,
	}
	publisher := &mockVerificationPublisher{}

	orch := NewVerificationOrchestrator(publisher, nil)
	req := BatchVerificationRequestDTO{
		TenantID: tenantID,
		AgentID:  "AGT-018",
		Detections: []domain.DetectionResult{
			{ResultID: "det-1", TenantID: tenantID, SignalID: "sig-1"},
			{ResultID: "det-2", TenantID: tenantID, SignalID: "sig-2"},
		},
	}

	resp, err := orch.ExecuteBatchVerification(context.Background(), verifier, req)
	if err != nil {
		t.Fatalf("expected batch verification success, got %v", err)
	}
	if resp.ResultsCount != 2 || len(resp.Results) != 2 {
		t.Fatalf("expected 2 batch results, got %d", resp.ResultsCount)
	}
	if publisher.verifEvents != 2 {
		t.Fatalf("expected 2 published EVT-021 events, got %d", publisher.verifEvents)
	}
}

func TestVerificationOrchestratorExecuteConfidenceAggregation(t *testing.T) {
	tenantID := "tenant-orch-test"
	scorer := &mockScoringAgent{
		id:       "AGT-024",
		tenantID: tenantID,
	}
	publisher := &mockVerificationPublisher{}

	orch := NewVerificationOrchestrator(publisher, nil)
	req := ConfidenceAggregationRequestDTO{
		TenantID: tenantID,
		Results: []domain.VerificationResult{
			{VerificationID: "ver-1", TenantID: tenantID, SignalID: "sig-1", ConfidenceScore: 0.90},
			{VerificationID: "ver-2", TenantID: tenantID, SignalID: "sig-1", ConfidenceScore: 0.86},
		},
	}

	resp, err := orch.ExecuteConfidenceAggregation(context.Background(), scorer, req)
	if err != nil {
		t.Fatalf("expected aggregation success, got %v", err)
	}
	if resp.Result.ConfidenceScore != 0.88 || resp.Result.UncertaintyMetric != 0.12 {
		t.Fatalf("unexpected aggregated result: %v", resp.Result)
	}
	if publisher.verifEvents != 1 {
		t.Fatalf("expected 1 EVT-021 published event for aggregated score, got %d", publisher.verifEvents)
	}
}
