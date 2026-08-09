package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockPredictiveEngine struct {
	id       string
	tenantID string
	name     string
	err      error
}

func (m *mockPredictiveEngine) ID() string       { return m.id }
func (m *mockPredictiveEngine) Name() string     { return m.name }
func (m *mockPredictiveEngine) TenantID() string { return m.tenantID }
func (m *mockPredictiveEngine) ExecutePrediction(ctx context.Context, payload map[string]string) (interface{}, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.ViralityPrediction{
		PredictionID:  "pred-mock-orch",
		TenantID:      m.tenantID,
		StoryID:       payload["story_id"],
		ViralityScore: 0.96,
		PredictedAt:   time.Now(),
	}, nil
}

type mockPredictivePublisher struct {
	predictionEvents int
}

func (m *mockPredictivePublisher) PublishSignalDetected(ctx context.Context, event *domain.MonitorSignalDetectedEvent) error {
	return nil
}
func (m *mockPredictivePublisher) PublishTrendingTopic(ctx context.Context, event *domain.TrendingTopicFoundEvent) error {
	return nil
}
func (m *mockPredictivePublisher) PublishDetectionResult(ctx context.Context, event *domain.DetectionResultReadyEvent) error {
	return nil
}
func (m *mockPredictivePublisher) PublishVerificationCompleted(ctx context.Context, event *domain.VerificationCompletedEvent) error {
	return nil
}
func (m *mockPredictivePublisher) PublishComplianceClearance(ctx context.Context, event *domain.ComplianceClearanceEvent) error {
	return nil
}
func (m *mockPredictivePublisher) PublishPipelineExecution(ctx context.Context, event *domain.PipelineExecutionEvent) error {
	return nil
}
func (m *mockPredictivePublisher) PublishPredictionIntelligence(ctx context.Context, event *domain.PredictiveIntelligenceEvent) error {
	m.predictionEvents++
	return nil
}

type mockPhase1ClientStale struct{}

func (m *mockPhase1ClientStale) RouteToContentFactory(ctx context.Context, tenantID, storyID string, metadata map[string]string) error {
	return nil
}
func (m *mockPhase1ClientStale) CheckCompliance(ctx context.Context, tenantID, contentID string) (bool, string, error) {
	return true, "", nil
}
func (m *mockPhase1ClientStale) ScheduleDistribution(ctx context.Context, tenantID, contentID string, platforms []string) error {
	return nil
}
func (m *mockPhase1ClientStale) CollectAnalytics(ctx context.Context, tenantID, contentID string) (map[string]interface{}, error) {
	return nil, nil
}
func (m *mockPhase1ClientStale) MonitorServiceHealth(ctx context.Context, serviceID string) (bool, error) {
	return true, nil
}
func (m *mockPhase1ClientStale) CollectOptimizationSignals(ctx context.Context, tenantID string) ([]map[string]interface{}, error) {
	oldTime := time.Now().Add(-2 * time.Hour).Format(time.RFC3339) // 2 hours old (> 3600s SLA)
	return []map[string]interface{}{
		{"signal_type": "EVT-034", "timestamp": oldTime},
	}, nil
}

func TestPredictionOrchestratorExecutePredictionAndEVT038(t *testing.T) {
	tenantID := "tenant-orch-test"
	engine := &mockPredictiveEngine{
		id:       "PRED-001",
		tenantID: tenantID,
		name:     "VIRALITY",
	}
	publisher := &mockPredictivePublisher{}

	orch := NewPredictionOrchestrator(publisher, nil, nil)
	req := PredictiveRequestDTO{
		TenantID: tenantID,
		EngineID: "PRED-001",
		Payload:  map[string]string{"story_id": "story-100"},
	}

	resp, err := orch.ExecutePrediction(context.Background(), engine, req)
	if err != nil {
		t.Fatalf("expected execute prediction success, got %v", err)
	}
	if resp.EngineID != "PRED-001" {
		t.Fatalf("unexpected engine id: %s", resp.EngineID)
	}
	if publisher.predictionEvents != 1 {
		t.Fatalf("expected 1 EVT-038 prediction event, got %d", publisher.predictionEvents)
	}

	feedback := orch.GetFeedbackLog(tenantID)
	if len(feedback) != 3 {
		t.Fatalf("expected 3 feedback loop signals (AGT-010, AGT-016, AGT-024), got %d", len(feedback))
	}
}

func TestFeedbackLoopControllerDampingAndDailyCap(t *testing.T) {
	ctrl := NewFeedbackLoopController(0.15, 0.30)
	tenantID := "tenant-alpha"
	target := "AGT-010"

	delta1, ok1, _ := ctrl.CalculateDampedDelta(tenantID, target, 1.0, 0.0)
	if !ok1 || delta1 != 0.10 {
		t.Fatalf("expected clamped delta 0.10, got %.2f (ok=%v)", delta1, ok1)
	}

	delta2, ok2, _ := ctrl.CalculateDampedDelta(tenantID, target, 1.0, 0.0)
	if !ok2 || delta2 != 0.10 {
		t.Fatalf("expected second clamped delta 0.10, got %.2f", delta2)
	}

	delta3, ok3, _ := ctrl.CalculateDampedDelta(tenantID, target, 1.0, 0.0)
	if !ok3 || delta3 != 0.10 {
		t.Fatalf("expected third clamped delta 0.10, got %.2f", delta3)
	}

	_, ok4, _ := ctrl.CalculateDampedDelta(tenantID, target, 1.0, 0.0)
	if ok4 {
		t.Fatalf("expected feedback to be paused when exceeding daily cumulative cap of 0.30")
	}
}

func TestAnalyticsSignalFreshnessSLA(t *testing.T) {
	tenantID := "tenant-alpha"
	orch := NewPredictionOrchestrator(nil, &mockPhase1ClientStale{}, nil)

	_, err := orch.ConsumeAnalyticsSignals(context.Background(), tenantID)
	if !errors.Is(err, domain.ErrStaleSignal) {
		t.Fatalf("expected ErrStaleSignal when signal timestamp is > 3600s old, got %v", err)
	}
}

func TestPredictionConflictArbitration(t *testing.T) {
	tenantID := "tenant-alpha"
	publisher := &mockPredictivePublisher{}
	orch := NewPredictionOrchestrator(publisher, nil, nil)

	preds := []PredictionResultItem{
		{PredictionID: "p1", TenantID: tenantID, EngineID: "PRED-001", Score: 0.90, Confidence: 0.95},
		{PredictionID: "p2", TenantID: tenantID, EngineID: "PRED-003", Score: 0.40, Confidence: 0.50}, // conf difference = 0.45 > 0.30
	}

	arb, err := orch.ArbitratePredictions(context.Background(), tenantID, preds)
	if err != nil {
		t.Fatalf("expected arbitration success, got %v", err)
	}
	if arb.Classification != "DISPUTED" {
		t.Fatalf("expected DISPUTED classification when confidence diff > 0.30, got %s", arb.Classification)
	}
	if publisher.predictionEvents != 1 {
		t.Fatalf("expected EVT-038 event published for arbitration, got %d", publisher.predictionEvents)
	}
}
