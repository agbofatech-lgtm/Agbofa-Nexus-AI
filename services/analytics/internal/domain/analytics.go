package domain

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"
)

var (
	ErrEventNotFound            = errors.New("analytics event not found")
	ErrSegmentNotFound          = errors.New("audience segment not found")
	ErrFeatureNotFound          = errors.New("feature record not found")
	ErrSignalNotFound           = errors.New("continuous learning signal not found")
	ErrCrossTenantViolation     = errors.New("prohibited cross-tenant analytics access or aggregation")
	ErrUnauthorizedLearningRule = errors.New("prohibited automatic behavioral modification without governance approval")
	ErrDownstreamBoundary       = errors.New("prohibited cross-boundary operation")
)

type AnalyticsEventRepository interface {
	SaveEvent(event AnalyticsEventEntity) error
	GetEvent(tenantID, eventID string) (*AnalyticsEventEntity, error)
	ListEvents(tenantID, eventType string, from, to time.Time) ([]AnalyticsEventEntity, error)
}

type EngagementMetricRepository interface {
	SaveMetric(metric EngagementMetricEntity) error
	GetMetricsByStory(tenantID, storyID string) ([]EngagementMetricEntity, error)
}

type AudienceSegmentRepository interface {
	SaveSegment(segment AudienceSegmentEntity) error
	GetSegment(tenantID, segmentID string) (*AudienceSegmentEntity, error)
}

type FeatureStoreRepository interface {
	SaveFeature(feature FeatureRecordEntity) error
	GetFeatures(tenantID, entityID string, names []string) ([]FeatureRecordEntity, error)
}

type LearningSignalRepository interface {
	SaveFeedback(f AIFeedbackRecordEntity) error
	SaveLearningSignal(s ContinuousLearningSignalEntity) error
	GetLearningSignal(tenantID, signalID string) (*ContinuousLearningSignalEntity, error)
}

type ContinuousLearningSafetyPolicy struct{}

func (p ContinuousLearningSafetyPolicy) ValidateLearningAdaptation(score float64, autoApprove bool) (bool, string) {
	if score >= 0.90 && autoApprove {
		return false, "GOVERNANCE_APPROVAL_REQUIRED"
	}
	return false, "GOVERNANCE_APPROVAL_REQUIRED"
}

func GenerateAnalyticsHash(tenantID, resourceID, category, action string, ts int64) string {
	raw := fmt.Sprintf("%s:%s:%s:%s:%d", tenantID, resourceID, category, action, ts)
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}

func ValidateTenantIsolation(tenantID, targetTenantID string) error {
	if tenantID == "" || targetTenantID == "" || tenantID != targetTenantID {
		return fmt.Errorf("%w: caller tenant %s cannot access target tenant %s", ErrCrossTenantViolation, tenantID, targetTenantID)
	}
	return nil
}
