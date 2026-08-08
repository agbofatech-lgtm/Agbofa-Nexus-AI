package domain

import (
	"errors"
)

var (
	ErrAgentNotFound      = errors.New("agent definition not found")
	ErrExecutionNotFound  = errors.New("agent execution not found")
	ErrWorkflowNotFound   = errors.New("workflow instance not found")
	ErrUnauthorizedTool   = errors.New("agent not authorized to invoke requested tool")
	ErrExecutionTimeout   = errors.New("agent execution timeout exceeded")
)

type AgentRepo interface {
	FindAgent(id string) (*AgentDefinition, error)
	SaveAgent(agent AgentDefinition) error
}

type ExecutionRepo interface {
	SaveExecution(exec AgentExecution) error
	GetExecution(id string) (*AgentExecution, error)
}

type WorkflowRepo interface {
	SaveWorkflow(wf WorkflowInstance) error
	GetWorkflow(id string) (*WorkflowInstance, error)
}

type AgentExecutionPolicy struct {
	MaxTokenBudget int
	AllowedTools   map[string]bool
}

func (p AgentExecutionPolicy) ValidateTool(tool string) error {
	if len(p.AllowedTools) == 0 {
		return nil
	}
	if !p.AllowedTools[tool] {
		return ErrUnauthorizedTool
	}
	return nil
}
