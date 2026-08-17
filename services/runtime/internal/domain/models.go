package domain

import (
	"time"
)

type PromptTemplateEntity struct {
	ID                string
	Name              string
	Version           string
	TemplateString    string
	RequiredVariables []string
	MaxInputLength    int
	DisallowInjection bool
	CreatedAt         time.Time
}

type ModelEndpointEntity struct {
	ModelID          string
	ProviderID       string
	Name             string
	Active           bool
	MaxContextTokens int
	SupportsStreaming bool
	SupportsTools    bool
}

type AgentDefinition struct {
	ID             string
	Name           string
	Description    string
	DefaultModelID string
	AllowedTools   []string
	MaxTokens      int
	TimeoutSeconds int
}

type AgentExecutionStatus string

const (
	ExecutionStatusCreated   AgentExecutionStatus = "CREATED"
	ExecutionStatusRunning   AgentExecutionStatus = "RUNNING"
	ExecutionStatusCompleted AgentExecutionStatus = "COMPLETED"
	ExecutionStatusFailed    AgentExecutionStatus = "FAILED"
	ExecutionStatusCancelled AgentExecutionStatus = "CANCELLED"
)

type AgentExecution struct {
	ExecutionID string
	TenantID    string
	AgentID     string
	Status      AgentExecutionStatus
	Output      string
	ErrorMsg    string
	TokensUsed  int
	CreatedAt   time.Time
	CompletedAt time.Time
}

type WorkflowInstance struct {
	InstanceID  string
	TenantID    string
	WorkflowID  string
	Status      string
	CurrentStep string
	StartedAt   time.Time
}

type GovernanceRule struct {
	ID          string
	Category    string
	Description string
	Mandatory   bool
}

type PlaybookChecklist struct {
	PlaybookID  string
	UnitID      string
	Items       map[string]bool
	VerifiedBy  string
	VerifiedAt  time.Time
}
