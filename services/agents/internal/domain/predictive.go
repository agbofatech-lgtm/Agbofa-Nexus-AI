package domain

import (
	"context"
	"time"
)

type TrendPhase string

const (
	TrendPhaseEmergence    TrendPhase = "EMERGENCE"
	TrendPhaseAcceleration TrendPhase = "ACCELERATION"
	TrendPhasePeak         TrendPhase = "PEAK"
	TrendPhaseDecay        TrendPhase = "DECAY"
	TrendPhaseResurgence   TrendPhase = "RESURGENCE"
)

type ViralityPrediction struct {
	PredictionID       string            `json:"prediction_id"`
	TenantID           string            `json:"tenant_id"`
	StoryID            string            `json:"story_id"`
	ViralityScore      float64           `json:"virality_score"`
	ConfidenceInterval float64           `json:"confidence_interval"`
	PeakTimeEstimate   time.Time         `json:"peak_time_estimate"`
	PredictedReach     int64             `json:"predicted_reach"`
	PredictedAt        time.Time         `json:"predicted_at"`
	Metadata           map[string]string `json:"metadata"`
}

type EngagementOptimization struct {
	OptimizationID  string            `json:"optimization_id"`
	TenantID        string            `json:"tenant_id"`
	ContentID       string            `json:"content_id"`
	OptimalTimes    []string          `json:"optimal_times"`
	TargetPlatforms []PlatformSource  `json:"target_platforms"`
	FramingAdvice   string            `json:"framing_advice"`
	OptimizedAt     time.Time         `json:"optimized_at"`
	Metadata        map[string]string `json:"metadata"`
}

type TrendLifecycleModel struct {
	ModelID        string            `json:"model_id"`
	TenantID       string            `json:"tenant_id"`
	TopicID        string            `json:"topic_id"`
	CurrentPhase   TrendPhase        `json:"current_phase"`
	Velocity       float64           `json:"velocity"`
	DecayRate      float64           `json:"decay_rate"`
	ResurgenceProb float64           `json:"resurgence_prob"`
	ModeledAt      time.Time         `json:"modeled_at"`
	Metadata       map[string]string `json:"metadata"`
}

type ContentPerformanceForecast struct {
	ForecastID       string            `json:"forecast_id"`
	TenantID         string            `json:"tenant_id"`
	ContentID        string            `json:"content_id"`
	PredictedViews   int64             `json:"predicted_views"`
	PredictedShares  int64             `json:"predicted_shares"`
	EngagementRate   float64           `json:"engagement_rate"`
	ConfidenceMetric float64           `json:"confidence_metric"`
	ForecastedAt     time.Time         `json:"forecasted_at"`
	Metadata         map[string]string `json:"metadata"`
}

type AnomalyDetectionEvent struct {
	AnomalyID     string            `json:"anomaly_id"`
	TenantID      string            `json:"tenant_id"`
	Platform      PlatformSource    `json:"platform"`
	AnomalyType   string            `json:"anomaly_type"`
	SeverityScore float64           `json:"severity_score"`
	Description   string            `json:"description"`
	DetectedAt    time.Time         `json:"detected_at"`
	Metadata      map[string]string `json:"metadata"`
}

type PredictiveEngine interface {
	ID() string
	Name() string
	TenantID() string
	ExecutePrediction(ctx context.Context, payload map[string]string) (interface{}, error)
}
