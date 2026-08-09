package domain

import "time"

// PredictionCompletedEvent is emitted when any prediction engine
// successfully produces a result.
type PredictionCompletedEvent struct {
	EventID        string                 `json:"event_id"`
	TenantID       string                 `json:"tenant_id"`
	PredictionType PredictionType         `json:"prediction_type"`
	RequestID      string                 `json:"request_id"`
	Score          float64                `json:"score"`
	Confidence     float64                `json:"confidence"`
	Tier           string                 `json:"tier"`
	ModelVersion   string                 `json:"model_version"`
	Outputs        map[string]interface{} `json:"outputs"`
	OccurredAt     time.Time              `json:"occurred_at"`
}

// ModelAccuracyUpdatedEvent is emitted when a model's accuracy metrics
// are recalculated after training or evaluation.
type ModelAccuracyUpdatedEvent struct {
	EventID          string         `json:"event_id"`
	TenantID         string         `json:"tenant_id"`
	PredictionType   PredictionType `json:"prediction_type"`
	ModelVersion     string         `json:"model_version"`
	PreviousAccuracy float64        `json:"previous_accuracy"`
	NewAccuracy      float64        `json:"new_accuracy"`
	DataPointsUsed   int            `json:"data_points_used"`
	OccurredAt       time.Time      `json:"occurred_at"`
}
