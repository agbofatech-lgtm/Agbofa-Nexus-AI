package application_test

import (
	"context"
	"testing"

	"github.com/agbofa/nexus/services/analytics/internal/application"
	"github.com/agbofa/nexus/services/analytics/internal/domain"
)

type inMemLearningRepo struct {
	feedbacks []domain.AIFeedbackRecordEntity
	signals   map[string]domain.ContinuousLearningSignalEntity
}

func newInMemLearningRepo() *inMemLearningRepo {
	return &inMemLearningRepo{
		signals: make(map[string]domain.ContinuousLearningSignalEntity),
	}
}

func (r *inMemLearningRepo) SaveFeedback(f domain.AIFeedbackRecordEntity) error {
	r.feedbacks = append(r.feedbacks, f)
	return nil
}

func (r *inMemLearningRepo) SaveLearningSignal(s domain.ContinuousLearningSignalEntity) error {
	r.signals[s.TenantID+":"+s.SignalID] = s
	return nil
}

func (r *inMemLearningRepo) GetLearningSignal(tenantID, signalID string) (*domain.ContinuousLearningSignalEntity, error) {
	s, ok := r.signals[tenantID+":"+signalID]
	if !ok {
		return nil, domain.ErrSignalNotFound
	}
	return &s, nil
}

func TestContinuousLearningAndExperimentationService_SafetyAndFlow(t *testing.T) {
	learning := newInMemLearningRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewContinuousLearningAndExperimentationService(learning, pub, audit)

	fb, err := svc.SubmitAIFeedback(
		context.Background(),
		"tenant-1",
		"story-500",
		"fact-checker-v1",
		"POSITIVE_ENGAGEMENT",
		0.05,
	)
	if err != nil || fb == nil {
		t.Fatalf("expected feedback submitted, got err=%v", err)
	}
	if len(pub.events) == 0 {
		t.Fatalf("expected analytics.ai_feedback event emitted")
	}

	sig, err := svc.EvaluateContinuousLearningSignal(context.Background(), "tenant-1", "fact-checker-v1", 0.92)
	if err != nil || sig == nil {
		t.Fatalf("expected signal evaluated, got err=%v", err)
	}
	if sig.Status != "GOVERNANCE_APPROVAL_REQUIRED" {
		t.Fatalf("expected GOVERNANCE_APPROVAL_REQUIRED, got %s", sig.Status)
	}

	_ = svc.RecordExperimentEvent(context.Background(), "tenant-1", "exp-10", "var-A", "ENGAGEMENT", 0.15)
	if len(audit.logs) < 2 {
		t.Fatalf("expected audit logs recorded, got %d", len(audit.logs))
	}
}
