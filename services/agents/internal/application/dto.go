package application

import (
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type ScanRequestDTO struct {
	TenantID string   `json:"tenant_id"`
	AgentID  string   `json:"agent_id"`
	Keywords []string `json:"keywords"`
	Limit    int      `json:"limit"`
}

type ScanResponseDTO struct {
	TenantID        string                 `json:"tenant_id"`
	AgentID         string                 `json:"agent_id"`
	Platform        domain.PlatformSource  `json:"platform"`
	SignalsCount    int                    `json:"signals_count"`
	Signals         []domain.MonitorSignal `json:"signals"`
	ExecutionTimeMs int64                  `json:"execution_time_ms"`
}

type AgentHealthReportDTO struct {
	AgentID        string             `json:"agent_id"`
	TenantID       string             `json:"tenant_id"`
	Status         domain.AgentStatus `json:"status"`
	Platform       string             `json:"platform"`
	RemainingQuota int                `json:"remaining_quota"`
	LastScanAt     time.Time          `json:"last_scan_at"`
}

type DetectionRequestDTO struct {
	TenantID string               `json:"tenant_id"`
	AgentID  string               `json:"agent_id"`
	Signal   domain.MonitorSignal `json:"signal"`
}

type DetectionResponseDTO struct {
	TenantID        string                  `json:"tenant_id"`
	AgentID         string                  `json:"agent_id"`
	Result          *domain.DetectionResult `json:"result"`
	ExecutionTimeMs int64                   `json:"execution_time_ms"`
}

type BatchDetectionRequestDTO struct {
	TenantID string                 `json:"tenant_id"`
	AgentID  string                 `json:"agent_id"`
	Signals  []domain.MonitorSignal `json:"signals"`
}

type BatchDetectionResponseDTO struct {
	TenantID        string                   `json:"tenant_id"`
	AgentID         string                   `json:"agent_id"`
	ResultsCount    int                      `json:"results_count"`
	Results         []domain.DetectionResult `json:"results"`
	ExecutionTimeMs int64                    `json:"execution_time_ms"`
}

type VerificationRequestDTO struct {
	TenantID  string                 `json:"tenant_id"`
	AgentID   string                 `json:"agent_id"`
	Detection domain.DetectionResult `json:"detection"`
}

type VerificationResponseDTO struct {
	TenantID        string                     `json:"tenant_id"`
	AgentID         string                     `json:"agent_id"`
	Result          *domain.VerificationResult `json:"result"`
	ExecutionTimeMs int64                      `json:"execution_time_ms"`
}

type BatchVerificationRequestDTO struct {
	TenantID   string                   `json:"tenant_id"`
	AgentID    string                   `json:"agent_id"`
	Detections []domain.DetectionResult `json:"detections"`
}

type BatchVerificationResponseDTO struct {
	TenantID        string                      `json:"tenant_id"`
	AgentID         string                      `json:"agent_id"`
	ResultsCount    int                         `json:"results_count"`
	Results         []domain.VerificationResult `json:"results"`
	ExecutionTimeMs int64                       `json:"execution_time_ms"`
}

type ConfidenceAggregationRequestDTO struct {
	TenantID string                      `json:"tenant_id"`
	Results  []domain.VerificationResult `json:"results"`
}

type ConfidenceAggregationResponseDTO struct {
	TenantID        string                     `json:"tenant_id"`
	AgentID         string                     `json:"agent_id"`
	Result          *domain.VerificationResult `json:"result"`
	ExecutionTimeMs int64                      `json:"execution_time_ms"`
}

type PipelineRequestDTO struct {
	TenantID string            `json:"tenant_id"`
	AgentID  string            `json:"agent_id"`
	Stage    string            `json:"stage"`
	Payload  map[string]string `json:"payload"`
}

type PipelineResponseDTO struct {
	TenantID        string                 `json:"tenant_id"`
	AgentID         string                 `json:"agent_id"`
	Result          *domain.PipelineResult `json:"result"`
	ExecutionTimeMs int64                  `json:"execution_time_ms"`
}

type PipelineHealthReportDTO struct {
	TenantID               string            `json:"tenant_id"`
	TotalAgents            int               `json:"total_agents"`
	ActiveAgents           int               `json:"active_agents"`
	Phase1ServicesOK       bool              `json:"phase1_services_ok"`
	LastCheckAt            time.Time         `json:"last_check_at"`
	Details                map[string]string `json:"details"`
	PersonalizationCount   string            `json:"personalization_count,omitempty"`
	PersonalizationEngines map[string]string `json:"personalization_engines,omitempty"`
}

type PredictiveRequestDTO struct {
	TenantID string            `json:"tenant_id"`
	EngineID string            `json:"engine_id"`
	Payload  map[string]string `json:"payload"`
}

type PredictiveResponseDTO struct {
	TenantID        string      `json:"tenant_id"`
	EngineID        string      `json:"engine_id"`
	Prediction      interface{} `json:"prediction"`
	ExecutionTimeMs int64       `json:"execution_time_ms"`
}

// ============================================================================
// IMP-019 Batch F5: Personalization DTOs (REQ-019-011)
// ============================================================================

type PersonalizationRequestDTO struct {
	TenantID string            `json:"tenant_id"`
	EngineID string            `json:"engine_id"`
	ReaderID string            `json:"reader_id"`
	Payload  map[string]string `json:"payload"`
}

type PersonalizationResponseDTO struct {
	TenantID string      `json:"tenant_id"`
	EngineID string      `json:"engine_id"`
	Result   interface{} `json:"result"`
	Status   string      `json:"status"`
}

type BatchPersonalizationRequestDTO struct {
	TenantID  string            `json:"tenant_id"`
	ReaderID  string            `json:"reader_id"`
	EngineIDs []string          `json:"engine_ids"`
	Payload   map[string]string `json:"payload"`
}

type BatchPersonalizationResponseDTO struct {
	TenantID        string                        `json:"tenant_id"`
	ReaderID        string                        `json:"reader_id"`
	Results         []domain.PersonalizedFeedItem `json:"results"`
	Status          string                        `json:"status"`
	EnginesExecuted int                           `json:"engines_executed"`
}
