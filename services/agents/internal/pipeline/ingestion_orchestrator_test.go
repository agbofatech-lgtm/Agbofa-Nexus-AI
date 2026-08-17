package pipeline

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockPipelineEventBus struct {
	lastEvent *domain.PipelineExecutionEvent
	err       error
}

func (m *mockPipelineEventBus) PublishSignalDetected(ctx context.Context, event *domain.MonitorSignalDetectedEvent) error {
	return nil
}
func (m *mockPipelineEventBus) PublishTrendingTopic(ctx context.Context, event *domain.TrendingTopicFoundEvent) error {
	return nil
}
func (m *mockPipelineEventBus) PublishDetectionResult(ctx context.Context, event *domain.DetectionResultReadyEvent) error {
	return nil
}
func (m *mockPipelineEventBus) PublishVerificationCompleted(ctx context.Context, event *domain.VerificationCompletedEvent) error {
	return nil
}
func (m *mockPipelineEventBus) PublishComplianceClearance(ctx context.Context, event *domain.ComplianceClearanceEvent) error {
	return nil
}
func (m *mockPipelineEventBus) PublishPipelineExecution(ctx context.Context, event *domain.PipelineExecutionEvent) error {
	m.lastEvent = event
	return m.err
}
func (m *mockPipelineEventBus) PublishPredictionIntelligence(ctx context.Context, event *domain.PredictiveIntelligenceEvent) error {
	return nil
}

func TestIngestionOrchestratorLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewIngestionOrchestrator(nil, nil)
	ctx := context.Background()

	if agent.ID() != "AGT-025" || agent.Name() != "Content Ingestion Orchestrator" {
		t.Fatalf("unexpected agent identity: %s / %s", agent.ID(), agent.Name())
	}

	// Uninitialized health check should fail
	if _, err := agent.HealthCheck(ctx); err == nil {
		t.Fatalf("expected error on uninitialized health check")
	}

	// Empty tenant ID should return ErrCrossTenantViolation
	if err := agent.Initialize(ctx, "", nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID, got %v", err)
	}

	// Initialize with tenant-A
	if err := agent.Initialize(ctx, "tenant-A", nil); err != nil {
		t.Fatalf("unexpected initialization error: %v", err)
	}

	if health, err := agent.HealthCheck(ctx); err != nil || health.Status != "HEALTHY" {
		t.Fatalf("expected HEALTHY health check after initialize")
	}

	// Cross-tenant operation should be rejected
	crossPayload := &domain.PipelinePayload{
		PayloadID: "pay-1",
		TenantID:  "tenant-B",
	}
	if _, err := agent.Operate(ctx, crossPayload); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for cross-tenant payload")
	}

	// Shutdown
	_ = agent.Shutdown(ctx)
	if _, err := agent.HealthCheck(ctx); err == nil {
		t.Fatalf("expected error on health check after shutdown")
	}
}

func TestIngestionOrchestratorRoutingAndPriority(t *testing.T) {
	agent := NewIngestionOrchestrator(nil, nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	testCases := []struct {
		tier         string
		velocity     string
		corroborated string
		wantTarget   string
		wantPriority string
	}{
		{"VERIFIED_TRUTH", "15", "true", "CONTENT_FACTORY", "BREAKING"},
		{"VERIFIED_TRUTH", "5", "false", "CONTENT_FACTORY", "HIGH"},
		{"PROVISIONAL", "5", "true", "EDITORIAL_REVIEW", "STANDARD"},
		{"DOUBTFUL", "5", "true", "VERIFICATION_LOOP", "LOW"},
	}

	for _, tc := range testCases {
		payload := &domain.PipelinePayload{
			PayloadID:      "pay-" + tc.tier + "-" + tc.wantPriority,
			TenantID:       "tenant-XYZ",
			ConfidenceTier: tc.tier,
			Metadata: map[string]string{
				"velocity":     tc.velocity,
				"corroborated": tc.corroborated,
			},
		}

		res, err := agent.Operate(ctx, payload)
		if err != nil {
			t.Fatalf("unexpected error operating payload %s: %v", payload.PayloadID, err)
		}
		if res.TargetPipeline != tc.wantTarget {
			t.Fatalf("expected target pipeline %s, got %s", tc.wantTarget, res.TargetPipeline)
		}
		if res.Priority != tc.wantPriority {
			t.Fatalf("expected priority %s, got %s", tc.wantPriority, res.Priority)
		}
	}
}

func TestIngestionOrchestratorIdempotencyAndRetry(t *testing.T) {
	mockBus := &mockPipelineEventBus{}
	agent := NewIngestionOrchestrator(nil, mockBus)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	payload := &domain.PipelinePayload{
		PayloadID:      "pay-idempotent-001",
		TenantID:       "tenant-XYZ",
		ConfidenceTier: "VERIFIED_TRUTH",
	}

	res1, err := agent.Operate(ctx, payload)
	if err != nil {
		t.Fatalf("unexpected error on first operate: %v", err)
	}
	if res1.Metadata["idempotency_guaranteed"] != "true" {
		t.Fatalf("missing idempotency_guaranteed flag")
	}

	// Second operate call with same PayloadID -> idempotent return of existing result
	res2, err := agent.Operate(ctx, payload)
	if err != nil {
		t.Fatalf("unexpected error on second operate: %v", err)
	}
	if res1.ResultID != res2.ResultID {
		t.Fatalf("expected identical result ID on duplicate PayloadID (idempotent behavior)")
	}

	// Verify report metrics count total_processed as 1 (not duplicated)
	report, err := agent.Report(ctx, payload)
	if err != nil {
		t.Fatalf("unexpected error on Report: %v", err)
	}
	if report.Metrics["total_processed"] != 1 {
		t.Fatalf("expected total_processed=1, got %v", report.Metrics["total_processed"])
	}

	// Verify simulated routing failure triggers 3x exponential backoff and emits IngestionFailedEvent
	failPayload := &domain.PipelinePayload{
		PayloadID:      "pay-fail-002",
		TenantID:       "tenant-XYZ",
		ConfidenceTier: "VERIFIED_TRUTH",
		Metadata: map[string]string{
			"simulate_routing_failure": "true",
		},
	}
	resFail, err := agent.Operate(ctx, failPayload)
	if err == nil || resFail.Status != domain.PipelineStatusFailed {
		t.Fatalf("expected error and FAILED status on simulated routing failure after 3 retries")
	}
	if mockBus.lastEvent == nil || mockBus.lastEvent.Metadata["event_type"] != "IngestionFailedEvent" {
		t.Fatalf("expected IngestionFailedEvent published on failure")
	}
}
