package domain

import (
	"time"
)

type TrendPhase string

const (
	TrendPhaseEmerging     TrendPhase = "EMERGING"
	TrendPhaseAccelerating TrendPhase = "ACCELERATING"
	TrendPhasePeak         TrendPhase = "PEAK"
	TrendPhaseDecay        TrendPhase = "DECAY"
	TrendPhaseEvergreen    TrendPhase = "EVERGREEN"
)

type TrendFeatures struct {
	MentionCount     int64             `json:"mention_count"`
	GrowthRate       float64           `json:"growth_rate"`
	PlatformSpread   int               `json:"platform_spread"`
	EntitySaturation float64           `json:"entity_saturation"`
	Metadata         map[string]string `json:"metadata"`
}

type TrendLifecyclePrediction struct {
	PredictionID        string        `json:"prediction_id"`
	TenantID            string        `json:"tenant_id"`
	TopicID             string        `json:"topic_id"`
	CurrentPhase        TrendPhase    `json:"current_phase"`
	PredictedNextPhase  TrendPhase    `json:"predicted_next_phase"`
	PhaseTransitionTime time.Time     `json:"phase_transition_time"`
	LongevityScore      float64       `json:"longevity_score"`
	Confidence          float64       `json:"confidence"`
	FeaturesUsed        TrendFeatures `json:"features_used"`
	PredictedAt         time.Time     `json:"predicted_at"`
	Metadata            map[string]string `json:"metadata"`
}
