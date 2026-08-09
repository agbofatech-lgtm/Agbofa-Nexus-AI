package domain

import (
	"time"
)

type AudienceSegment struct {
	SegmentID   string            `json:"segment_id"`
	TenantID    string            `json:"tenant_id"`
	Name        string            `json:"name"`
	Demographic map[string]string `json:"demographic"`
	Interests   []string          `json:"interests"`
	ActiveHours []string          `json:"active_hours"`
	Metadata    map[string]string `json:"metadata"`
}

type EngagementFeatures struct {
	ContentType     string            `json:"content_type"`
	TargetPlatforms []string          `json:"target_platforms"`
	WordCount       int               `json:"word_count"`
	MediaCount      int               `json:"media_count"`
	TargetAudience  string            `json:"target_audience"`
	Metadata        map[string]string `json:"metadata"`
}

type EngagementForecast struct {
	ForecastID       string             `json:"forecast_id"`
	TenantID         string             `json:"tenant_id"`
	ContentID        string             `json:"content_id"`
	ExpectedViews    int64              `json:"expected_views"`
	ExpectedShares   int64              `json:"expected_shares"`
	ExpectedComments int64              `json:"expected_comments"`
	EngagementRate   float64            `json:"engagement_rate"`
	Confidence       float64            `json:"confidence"`
	AudienceSegment  AudienceSegment    `json:"audience_segment"`
	FeaturesUsed     EngagementFeatures `json:"features_used"`
	ForecastedAt     time.Time          `json:"forecasted_at"`
	Metadata         map[string]string  `json:"metadata"`
}
