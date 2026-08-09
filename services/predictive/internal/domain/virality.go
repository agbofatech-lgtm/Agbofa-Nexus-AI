package domain

import (
	"time"
)

type ViralityFeatures struct {
	VelocityPerHour    float64           `json:"velocity_per_hour"`
	SourceAuthority    float64           `json:"source_authority"`
	CrossPlatformShare int               `json:"cross_platform_share"`
	SentimentIntensity float64           `json:"sentiment_intensity"`
	TopicRelevance     float64           `json:"topic_relevance"`
	Metadata           map[string]string `json:"metadata"`
}

type ViralityPrediction struct {
	PredictionID    string           `json:"prediction_id"`
	TenantID        string           `json:"tenant_id"`
	ContentID       string           `json:"content_id"`
	ViralityScore   float64          `json:"virality_score"`
	Confidence      float64          `json:"confidence"`
	PeakTimeHorizon time.Duration    `json:"peak_time_horizon"`
	EstimatedReach  int64            `json:"estimated_reach"`
	FeaturesUsed    ViralityFeatures `json:"features_used"`
	PredictedAt     time.Time        `json:"predicted_at"`
	Metadata        map[string]string `json:"metadata"`
}

type ViralityModel struct {
	ModelID        string             `json:"model_id"`
	TenantID       string             `json:"tenant_id"`
	Version        string             `json:"version"`
	FeatureWeights map[string]float64 `json:"feature_weights"`
	TrainedAt      time.Time          `json:"trained_at"`
	Metadata       map[string]string  `json:"metadata"`
}

const ViralityModelFallbackThreshold = 0.70

// ModelFallbackPolicy governs when the predictive model delegates to
// agent heuristics.
type ModelFallbackPolicy struct {
	// Threshold below which the predictive model delegates to the
	// agent heuristic fallback. Range: 0.0-1.0.
	Threshold float64
}

// DefaultModelFallbackPolicy returns the authoritative fallback policy.
func DefaultModelFallbackPolicy() ModelFallbackPolicy {
	return ModelFallbackPolicy{
		Threshold: ViralityModelFallbackThreshold,
	}
}
