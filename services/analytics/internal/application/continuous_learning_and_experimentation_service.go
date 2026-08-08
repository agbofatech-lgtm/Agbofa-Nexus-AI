package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/analytics/internal/domain"
)

type ContinuousLearningAndExperimentationService struct {
	learning domain.LearningSignalRepository
	pub      EventPublisher
	audit    AuditLogger
	policy   domain.ContinuousLearningSafetyPolicy
}

func NewContinuousLearningAndExperimentationService(
	learning domain.LearningSignalRepository,
	pub EventPublisher,
	audit AuditLogger,
) *ContinuousLearningAndExperimentationService {
	return &ContinuousLearningAndExperimentationService{
		learning: learning,
		pub:      pub,
		audit:    audit,
		policy:   domain.ContinuousLearningSafetyPolicy{},
	}
}

func (s *ContinuousLearningAndExperimentationService) SubmitAIFeedback(
	ctx context.Context,
	tenantID, storyID, modelID, feedbackType string,
	scoreDelta float64,
) (*domain.AIFeedbackRecordEntity, error) {
	if tenantID == "" || storyID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	ts := time.Now().Unix()
	hash := domain.GenerateAnalyticsHash(tenantID, storyID, string(domain.SignalCategoryInferredSignals), feedbackType, ts)

	f := domain.AIFeedbackRecordEntity{
		FeedbackID:     fmt.Sprintf("fdbk-%d", time.Now().UnixNano()),
		TenantID:       tenantID,
		StoryID:        storyID,
		ModelID:        modelID,
		FeedbackType:   feedbackType,
		ScoreDelta:     scoreDelta,
		ProvenanceHash: hash,
		SubmittedAt:    time.Now(),
	}

	if err := s.learning.SaveFeedback(f); err != nil {
		return nil, err
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "analytics.ai_feedback", tenantID, "SVC-080", fmt.Sprintf("story=%s model=%s delta=%.2f", storyID, modelID, scoreDelta))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "submit_ai_feedback", f.FeedbackID, fmt.Sprintf("type=%s delta=%.2f", feedbackType, scoreDelta))
	}

	return &f, nil
}

func (s *ContinuousLearningAndExperimentationService) EvaluateContinuousLearningSignal(
	ctx context.Context,
	tenantID, modelID string,
	adaptationScore float64,
) (*domain.ContinuousLearningSignalEntity, error) {
	if tenantID == "" || modelID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	_, status := s.policy.ValidateLearningAdaptation(adaptationScore, false)

	ts := time.Now().Unix()
	hash := domain.GenerateAnalyticsHash(tenantID, modelID, string(domain.SignalCategoryAIGeneratedInsights), "EVALUATE_LEARNING", ts)

	sig := domain.ContinuousLearningSignalEntity{
		SignalID:        fmt.Sprintf("sig-%d", time.Now().UnixNano()),
		TenantID:        tenantID,
		ModelID:         modelID,
		Status:          status,
		AdaptationScore: adaptationScore,
		GovernanceNote:  "automatic production rule modification prohibited; requires explicit human governance approval",
		ProvenanceHash:  hash,
		EvaluatedAt:     time.Now(),
	}

	if err := s.learning.SaveLearningSignal(sig); err != nil {
		return nil, err
	}

	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "evaluate_learning_signal", sig.SignalID, fmt.Sprintf("model=%s status=%s", modelID, status))
	}

	return &sig, nil
}

func (s *ContinuousLearningAndExperimentationService) RecordExperimentEvent(
	ctx context.Context,
	tenantID, experimentID, variantID, metricName string,
	value float64,
) error {
	if tenantID == "" || experimentID == "" {
		return domain.ErrCrossTenantViolation
	}

	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "record_experiment_event", experimentID, fmt.Sprintf("var=%s metric=%s val=%.2f", variantID, metricName, value))
	}
	return nil
}

func (s *ContinuousLearningAndExperimentationService) GetLearningSignal(ctx context.Context, tenantID, signalID string) (*domain.ContinuousLearningSignalEntity, error) {
	return s.learning.GetLearningSignal(tenantID, signalID)
}
