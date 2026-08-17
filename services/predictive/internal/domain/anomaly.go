package domain

import (
	"time"
)

type AnomalyType string

const (
	AnomalyTypeSpike          AnomalyType = "SPIKE"
	AnomalyTypeDrop           AnomalyType = "DROP"
	AnomalyTypePatternShift   AnomalyType = "PATTERN_SHIFT"
	AnomalyTypeInauthenticBot AnomalyType = "INAUTHENTIC_BOT"
	AnomalyTypeDivergence     AnomalyType = "DIVERGENCE"
	AnomalyTypeEmergence      AnomalyType = "EMERGENCE"
)

type AnomalyScore struct {
	Score     float64           `json:"score"`
	Threshold float64           `json:"threshold"`
	Severity  string            `json:"severity"` // LOW, MEDIUM, HIGH, CRITICAL
	Metadata  map[string]string `json:"metadata"`
}

type AnomalyDetectionResult struct {
	DetectionID  string            `json:"detection_id"`
	TenantID     string            `json:"tenant_id"`
	TargetEntity string            `json:"target_entity"`
	EntityType   string            `json:"entity_type"` // SIGNAL, STORY, METRIC, AGENT
	AnomalyType  AnomalyType       `json:"anomaly_type"`
	Score        AnomalyScore      `json:"score"`
	IsAnomaly    bool              `json:"is_anomaly"`
	Confidence   float64           `json:"confidence"`
	Explanation  string            `json:"explanation"`
	DetectedAt   time.Time         `json:"detected_at"`
	Metadata     map[string]string `json:"metadata"`
}
