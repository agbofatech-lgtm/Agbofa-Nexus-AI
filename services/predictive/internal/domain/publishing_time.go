package domain

import (
	"time"
)

type PublishingTimeFeatures struct {
	Platform        string            `json:"platform"`
	ContentType     string            `json:"content_type"`
	TargetTimezone  string            `json:"target_timezone"`
	AuthorID        string            `json:"author_id"`
	TopicID         string            `json:"topic_id"`
	ContentCategory string            `json:"content_category"`
	Metadata        map[string]string `json:"metadata"`
}

type PublishingTimePrediction struct {
	PredictionID             string                 `json:"prediction_id"`
	TenantID                 string                 `json:"tenant_id"`
	ContentID                string                 `json:"content_id"`
	ExpectedEngagementScore  float64                `json:"expected_engagement_score"`
	Confidence               float64                `json:"confidence"`
	OptimalTimeUTC           time.Time              `json:"optimal_time_utc"`
	AlternativeTimes         []string               `json:"alternative_times"`
	TimezoneAdjustedTimes    []string               `json:"timezone_adjusted_times"`
	ExpectedEngagementByHour map[string]float64     `json:"expected_engagement_by_hour"`
	FeaturesUsed             PublishingTimeFeatures `json:"features_used"`
	PredictedAt              time.Time              `json:"predicted_at"`
	Metadata                 map[string]string      `json:"metadata"`
}
