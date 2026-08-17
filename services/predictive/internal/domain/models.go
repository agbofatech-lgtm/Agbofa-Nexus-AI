package domain

import (
	"errors"
	"time"
)

var (
	ErrCrossTenantViolation     = errors.New("cross-tenant access violation")
	ErrInvalidPredictionType    = errors.New("invalid prediction type")
	ErrModelNotFound            = errors.New("model not found")
	ErrInsufficientTrainingData = errors.New("insufficient training data (minimum 100 examples required)")
	ErrModelImmutable           = errors.New("model versions are immutable once saved")
)

type PredictionType string

const (
	PredictionTypeVirality            PredictionType = "VIRALITY"
	PredictionTypeEngagement          PredictionType = "ENGAGEMENT"
	PredictionTypeContentOptimization PredictionType = "CONTENT_OPTIMIZATION"
	PredictionTypeTrendLifecycle      PredictionType = "TREND_LIFECYCLE"
	PredictionTypeAnomaly             PredictionType = "ANOMALY"
	PredictionTypePublishingTime      PredictionType = "PUBLISHING_TIME"
)

type PredictionRequest struct {
	RequestID      string                 `json:"request_id"`
	TenantID       string                 `json:"tenant_id"`
	PredictionType PredictionType         `json:"prediction_type"`
	Features       map[string]interface{} `json:"features"`
	RequestedAt    time.Time              `json:"requested_at"`
	Metadata       map[string]string      `json:"metadata"`
}

type PredictionResult struct {
	ResultID       string                 `json:"result_id"`
	RequestID      string                 `json:"request_id"`
	TenantID       string                 `json:"tenant_id"`
	PredictionType PredictionType         `json:"prediction_type"`
	Score          float64                `json:"score"`
	Confidence     float64                `json:"confidence"`
	Outputs        map[string]interface{} `json:"outputs"`
	ModelVersion   string                 `json:"model_version"`
	PredictedAt    time.Time              `json:"predicted_at"`
	Metadata       map[string]string      `json:"metadata"`
}

type ModelMetadata struct {
	ModelID        string         `json:"model_id"`
	TenantID       string         `json:"tenant_id"`
	PredictionType PredictionType `json:"prediction_type"`
	Version        string         `json:"version"`
	AccuracyMetric float64        `json:"accuracy_metric"`
	TrainedAt      time.Time      `json:"trained_at"`
	Status         string         `json:"status"` // ACTIVE, RETIRED, CANDIDATE
}

type Model struct {
	ModelID        string            `json:"model_id"`
	TenantID       string            `json:"tenant_id"`
	PredictionType PredictionType    `json:"prediction_type"`
	Version        string            `json:"version"`
	Description    string            `json:"description"`
	CreatedAt      time.Time         `json:"created_at"`
	Metadata       map[string]string `json:"metadata"`
}

type TrainingExample struct {
	ExampleID      string                 `json:"example_id"`
	TenantID       string                 `json:"tenant_id"`
	PredictionType PredictionType         `json:"prediction_type"`
	Features       map[string]interface{} `json:"features"`
	Labels         map[string]interface{} `json:"labels"`
	RecordedAt     time.Time              `json:"recorded_at"`
}

type DataStats struct {
	PredictionType PredictionType    `json:"prediction_type"`
	TotalExamples  int64             `json:"total_examples"`
	FirstRecorded  time.Time         `json:"first_recorded"`
	LastRecorded   time.Time         `json:"last_recorded"`
	FeatureStats   map[string]string `json:"feature_stats"`
}
