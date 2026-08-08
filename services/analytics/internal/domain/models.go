package domain

import (
	"time"
)

type SignalCategory string

const (
	SignalCategoryObservedData        SignalCategory = "OBSERVED_DATA"
	SignalCategoryDerivedMetrics      SignalCategory = "DERIVED_METRICS"
	SignalCategoryInferredSignals     SignalCategory = "INFERRED_SIGNALS"
	SignalCategoryAIGeneratedInsights SignalCategory = "AI_GENERATED_INSIGHTS"
	SignalCategoryPredictions         SignalCategory = "PREDICTIONS"
	SignalCategoryRecommendations     SignalCategory = "RECOMMENDATIONS"
)

type AnalyticsEventEntity struct {
	EventID        string
	TenantID       string
	EventType      string // PAGE_VIEW, STORY_ENGAGEMENT, SHARE, RECOMMENDATION_CLICK
	StoryID        string
	ChannelID      string
	CohortID       string
	Category       SignalCategory
	Properties     map[string]string
	ProvenanceHash string
	OccurredAt     time.Time
}

type EngagementMetricEntity struct {
	StoryID            string
	TenantID           string
	MetricName         string // TOTAL_VIEWS, ENGAGEMENT_RATE, SHARES, COMPLETION_RATE
	Value              float64
	CalculationSource  string
	ProvenanceHash     string
	UpdatedAt          time.Time
}

type AudienceSegmentEntity struct {
	SegmentID          string
	TenantID           string
	Name               string
	EngagementScore    float64
	TopCategories      []string
	ProvenanceHash     string
	UpdatedAt          time.Time
}

type FeatureRecordEntity struct {
	FeatureID      string
	TenantID       string
	EntityID       string
	FeatureName    string
	FeatureValue   string
	ValueType      string
	ProvenanceHash string
	UpdatedAt      time.Time
}

type AIFeedbackRecordEntity struct {
	FeedbackID     string
	TenantID       string
	StoryID        string
	ModelID        string
	FeedbackType   string // POSITIVE_ENGAGEMENT, NEGATIVE_ENGAGEMENT, MANUAL_REVIEW_CORRECTION
	ScoreDelta     float64
	ProvenanceHash string
	SubmittedAt    time.Time
}

type ContinuousLearningSignalEntity struct {
	SignalID         string
	TenantID         string
	ModelID          string
	Status           string // SIGNAL_COLLECTED, EVALUATED, GOVERNANCE_APPROVAL_REQUIRED
	AdaptationScore  float64
	GovernanceNote   string
	ProvenanceHash   string
	EvaluatedAt      time.Time
}

type WorkflowInstanceRef struct {
	InstanceID string
	TenantID   string
	WorkflowID string
	Status     string
	Parameters map[string]string
	StartedAt  time.Time
}
