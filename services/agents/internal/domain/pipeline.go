package domain

import (
	"context"
	"time"
)

type PipelineStage string

const (
	PipelineStageIngestion    PipelineStage = "INGESTION"
	PipelineStageStoryGraph   PipelineStage = "STORY_GRAPH"
	PipelineStageFactory      PipelineStage = "CONTENT_FACTORY"
	PipelineStageCompliance   PipelineStage = "COMPLIANCE"
	PipelineStageDistribution PipelineStage = "DISTRIBUTION"
	PipelineStageAnalytics    PipelineStage = "ANALYTICS"
	PipelineStageFeedback     PipelineStage = "FEEDBACK"
	PipelineStageOperations   PipelineStage = "OPERATIONS"
)

type PipelineStatus string

const (
	PipelineStatusSuccess PipelineStatus = "SUCCESS"
	PipelineStatusFailed  PipelineStatus = "FAILED"
	PipelineStatusAborted PipelineStatus = "ABORTED"
	PipelineStatusPending PipelineStatus = "PENDING"
)

type CircuitBreakerState string

const (
	CircuitBreakerClosed   CircuitBreakerState = "CLOSED"
	CircuitBreakerOpen     CircuitBreakerState = "OPEN"
	CircuitBreakerHalfOpen CircuitBreakerState = "HALF_OPEN"
)

type CheckpointStatus string

const (
	CheckpointStatusInProgress CheckpointStatus = "IN_PROGRESS"
	CheckpointStatusCompleted  CheckpointStatus = "COMPLETED"
	CheckpointStatusFailed     CheckpointStatus = "FAILED"
)

type PipelineResult struct {
	ExecutionID   string            `json:"execution_id"`
	TenantID      string            `json:"tenant_id"`
	AgentID       string            `json:"agent_id"`
	Stage         PipelineStage     `json:"stage"`
	Status        PipelineStatus    `json:"status"`
	OutputPayload string            `json:"output_payload"`
	ExecutedAt    time.Time         `json:"executed_at"`
	Metadata      map[string]string `json:"metadata"`
	// Additive fields for IMP-017-D PipelineOperators
	ResultID       string    `json:"result_id,omitempty"`
	PayloadID      string    `json:"payload_id,omitempty"`
	TargetPipeline string    `json:"target_pipeline,omitempty"`
	Priority       string    `json:"priority,omitempty"`
	RoutedAt       time.Time `json:"routed_at,omitempty"`
}

type PipelineState struct {
	StateID             string              `json:"state_id"`
	TenantID            string              `json:"tenant_id"`
	AgentID             string              `json:"agent_id"`
	CurrentStage        PipelineStage       `json:"current_stage"`
	LastStatus          PipelineStatus      `json:"last_status"`
	CircuitState        CircuitBreakerState `json:"circuit_state"`
	CheckpointStatus    CheckpointStatus    `json:"checkpoint_status"`
	PayloadHash         string              `json:"payload_hash"`
	LastUpdated         time.Time           `json:"last_updated"`
}

type PipelineAuditEntry struct {
	AuditID     string            `json:"audit_id"`
	TenantID    string            `json:"tenant_id"`
	ExecutionID string            `json:"execution_id"`
	AgentID     string            `json:"agent_id"`
	Action      string            `json:"action"`
	Details     string            `json:"details"`
	OccurredAt  time.Time         `json:"occurred_at"`
}

type FeedbackSignal struct {
	SignalID    string    `json:"signal_id"`
	TenantID    string    `json:"tenant_id"`
	TargetAgent string    `json:"target_agent"`
	ScoreDelta  float64   `json:"score_delta"`
	Reason      string    `json:"reason"`
	GeneratedAt time.Time `json:"generated_at"`
}

type PipelineAgent interface {
	Agent
	ExecutePipeline(ctx context.Context, payload map[string]string) (*PipelineResult, error)
	Stage() PipelineStage
	UpstreamAgents() []string
	DownstreamAgents() []string
}

// Additive domain models for IMP-017-D Pipeline Agents (AGT-025 through AGT-032)

type PipelinePayload struct {
	PayloadID       string            `json:"payload_id"`
	TenantID        string            `json:"tenant_id"`
	SignalID        string            `json:"signal_id"`
	ClaimID         string            `json:"claim_id"`
	Content         string            `json:"content"`
	ConfidenceScore float64           `json:"confidence_score"`
	ConfidenceTier  string            `json:"confidence_tier"` // VERIFIED_TRUTH, PROVISIONAL, DOUBTFUL
	Verdict         string            `json:"verdict"`
	Sources         []Source          `json:"sources"`
	Evidence        []EvidenceItem    `json:"evidence"`
	Metadata        map[string]string `json:"metadata"`
}

type PipelineReport struct {
	ReportID        string                 `json:"report_id"`
	TenantID        string                 `json:"tenant_id"`
	PayloadID       string                 `json:"payload_id"`
	AgentID         string                 `json:"agent_id"`
	Metrics         map[string]interface{} `json:"metrics"`
	Anomalies       []string               `json:"anomalies"`
	Recommendations []string               `json:"recommendations"`
	GeneratedAt     time.Time              `json:"generated_at"`
}

const PipelineStageVerification = "VERIFICATION"
const PipelineStageOrigination = "ORIGINATION"
const PipelineStageProcessing = "PROCESSING"
