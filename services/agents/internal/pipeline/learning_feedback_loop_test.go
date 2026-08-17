package pipeline

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockCredRepository struct {
	lastScore *domain.SourceCredibilityScore
	err       error
}

func (m *mockCredRepository) SaveCredibility(ctx context.Context, tenantID string, score *domain.SourceCredibilityScore) error {
	m.lastScore = score
	return m.err
}
func (m *mockCredRepository) GetCredibility(ctx context.Context, tenantID, sourceID string) (*domain.SourceCredibilityScore, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.SourceCredibilityScore{SourceID: sourceID, TenantID: tenantID, TrustScore: 0.70}, nil
}
func (m *mockCredRepository) UpsertCredibility(ctx context.Context, tenantID string, score *domain.SourceCredibilityScore) error {
	m.lastScore = score
	return m.err
}

func TestLearningFeedbackLoopLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewLearningFeedbackLoop(nil, nil, nil, nil)
	ctx := context.Background()

	if agent.ID() != "AGT-031" || agent.Name() != "Learning Feedback Loop" {
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

func TestLearningFeedbackLoopOperateAndCredibilityUpdates(t *testing.T) {
	mockCred := &mockCredRepository{}
	agent := NewLearningFeedbackLoop(nil, nil, mockCred, nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	testCases := []struct {
		outcome    string
		wantTarget string
		wantDelta  string
		wantNew    string
	}{
		{"VERIFIED_TRUE", "CREDIBILITY_UPDATE", "0.05", "0.75"},
		{"MISINFORMATION", "CREDIBILITY_UPDATE", "-0.15", "0.55"},
		{"CORRECTION", "CREDIBILITY_UPDATE", "-0.05", "0.65"},
		{"MODEL_DRIFT", "MODEL_UPDATE", "0.00", "0.70"},
		{"NORMAL", "NO_UPDATE", "0.00", "0.70"},
	}

	for _, tc := range testCases {
		payload := &domain.PipelinePayload{
			PayloadID: "pay-learn-" + tc.outcome,
			TenantID:  "tenant-XYZ",
			Metadata: map[string]string{
				"outcome":   tc.outcome,
				"source_id": "src-100",
			},
		}
		res, err := agent.Operate(ctx, payload)
		if err != nil {
			t.Fatalf("unexpected error on outcome %s: %v", tc.outcome, err)
		}
		if res.TargetPipeline != tc.wantTarget {
			t.Fatalf("for %s: expected target pipeline %s, got %s", tc.outcome, tc.wantTarget, res.TargetPipeline)
		}
		if res.Metadata["score_delta"] != tc.wantDelta {
			t.Fatalf("for %s: expected delta %s, got %s", tc.outcome, tc.wantDelta, res.Metadata["score_delta"])
		}
		if res.Metadata["new_score"] != tc.wantNew {
			t.Fatalf("for %s: expected new_score %s, got %s", tc.outcome, tc.wantNew, res.Metadata["new_score"])
		}

		// Check mandatory behavioral flags
		if res.Metadata["reversibility_guaranteed"] != "true" || res.Metadata["code_modification_prohibited"] != "true" {
			t.Fatalf("missing mandatory reversibility or code modification prohibited flags")
		}
	}

	// Ensure repository was called on credibility update
	if mockCred.lastScore == nil || mockCred.lastScore.SourceID != "src-100" {
		t.Fatalf("expected SourceCredibilityRepository to be updated")
	}
}

func TestLearningFeedbackLoopRLSEnforcement(t *testing.T) {
	agent := NewLearningFeedbackLoop(nil, nil, nil, nil)
	ctx := context.Background()

	sigB := &domain.FeedbackSignal{
		SignalID:    "sig-b",
		TenantID:    "tenant-B",
		TargetAgent: "AGT-025",
	}

	// Empty tenant ID must return ErrCrossTenantViolation
	if err := agent.PersistFeedbackSignalSQL(ctx, nil, "", sigB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenant ID, got %v", err)
	}
	// Mismatched tenant ID must return ErrCrossTenantViolation
	if err := agent.PersistFeedbackSignalSQL(ctx, nil, "tenant-A", sigB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on mismatched tenant ID, got %v", err)
	}
}
