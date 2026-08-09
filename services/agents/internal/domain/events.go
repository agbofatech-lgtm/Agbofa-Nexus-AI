package domain

import "time"

const (
	EventTypeMonitorSignalDetected           string = "EVT-019"
	EventTypeTrendingTopicFound              string = "EVT-039"
	EventTypeDetectionResultReady            string = "EVT-020"
	EventTypeVerificationCompleted           string = "EVT-021"
	EventTypeComplianceClearance             string = "EVT-025"
	EventTypePipelineExecutionCompleted      string = "EVT-045"
	EventTypePredictiveIntelligenceGenerated string = "EVT-038"
	EventTypeBehavioralSignalRecorded        string = "EVT-040"
	EventTypePersonalizedFeedGenerated       string = "EVT-041"
	EventTypePreferenceModelUpdated          string = "EVT-042"
)

type MonitorSignalDetectedEvent struct {
	EventID    string         `json:"event_id"`
	TenantID   string         `json:"tenant_id"`
	AgentID    string         `json:"agent_id"`
	Platform   PlatformSource `json:"platform"`
	Signal     MonitorSignal  `json:"signal"`
	OccurredAt time.Time      `json:"occurred_at"`
}

type TrendingTopicFoundEvent struct {
	EventID    string         `json:"event_id"`
	TenantID   string         `json:"tenant_id"`
	AgentID    string         `json:"agent_id"`
	Platform   PlatformSource `json:"platform"`
	Topic      TrendingTopic  `json:"topic"`
	OccurredAt time.Time      `json:"occurred_at"`
}

type DetectionResultReadyEvent struct {
	EventID    string          `json:"event_id"`
	TenantID   string          `json:"tenant_id"`
	AgentID    string          `json:"agent_id"`
	SignalID   string          `json:"signal_id"`
	Result     DetectionResult `json:"result"`
	OccurredAt time.Time       `json:"occurred_at"`
}

type VerificationCompletedEvent struct {
	EventID      string             `json:"event_id"`
	TenantID     string             `json:"tenant_id"`
	AgentID      string             `json:"agent_id"`
	SignalID     string             `json:"signal_id"`
	Verification VerificationResult `json:"verification"`
	OccurredAt   time.Time          `json:"occurred_at"`
}

type ComplianceClearanceEvent struct {
	EventID         string    `json:"event_id"`
	TenantID        string    `json:"tenant_id"`
	ContentID       string    `json:"content_id"`
	IsCleared       bool      `json:"is_cleared"`
	ClearanceReason string    `json:"clearance_reason"`
	OccurredAt      time.Time `json:"occurred_at"`
}

type PipelineExecutionEvent struct {
	EventID     string         `json:"event_id"`
	TenantID    string         `json:"tenant_id"`
	ExecutionID string         `json:"execution_id"`
	AgentID     string         `json:"agent_id"`
	Stage       PipelineStage  `json:"stage"`
	Result      PipelineResult `json:"result"`
	OccurredAt  time.Time      `json:"occurred_at"`
}

type PredictiveIntelligenceEvent struct {
	EventID        string      `json:"event_id"`
	TenantID       string      `json:"tenant_id"`
	EngineID       string      `json:"engine_id"`
	PredictionType string      `json:"prediction_type"`
	Payload        interface{} `json:"payload"`
	OccurredAt     time.Time   `json:"occurred_at"`
}

type BehavioralSignalRecordedEvent struct {
	EventID    string           `json:"event_id"`
	TenantID   string           `json:"tenant_id"`
	ReaderID   string           `json:"reader_id"`
	Signal     BehavioralSignal `json:"signal"`
	OccurredAt time.Time        `json:"occurred_at"`
}

type PersonalizedFeedGeneratedEvent struct {
	EventID    string           `json:"event_id"`
	TenantID   string           `json:"tenant_id"`
	ReaderID   string           `json:"reader_id"`
	Feed       PersonalizedFeed `json:"feed"`
	OccurredAt time.Time        `json:"occurred_at"`
}

type PreferenceModelUpdatedEvent struct {
	EventID    string        `json:"event_id"`
	TenantID   string        `json:"tenant_id"`
	ReaderID   string        `json:"reader_id"`
	Profile    ReaderProfile `json:"profile"`
	OccurredAt time.Time     `json:"occurred_at"`
}
