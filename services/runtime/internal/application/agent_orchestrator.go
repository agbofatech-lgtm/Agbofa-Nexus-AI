package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/runtime/internal/domain"
)

type EventPublisher interface {
	PublishEvent(ctx context.Context, eventType, tenantID, source, payload string) error
}

type AgentOrchestrator struct {
	agents    domain.AgentRepo
	execs     domain.ExecutionRepo
	workflows domain.WorkflowRepo
	publisher EventPublisher
	audit     AuditLogger
}

func NewAgentOrchestrator(
	agents domain.AgentRepo,
	execs domain.ExecutionRepo,
	workflows domain.WorkflowRepo,
	publisher EventPublisher,
	audit AuditLogger,
) *AgentOrchestrator {
	return &AgentOrchestrator{
		agents:    agents,
		execs:     execs,
		workflows: workflows,
		publisher: publisher,
		audit:     audit,
	}
}

func (o *AgentOrchestrator) RegisterAgent(ctx context.Context, agent domain.AgentDefinition) error {
	if err := o.agents.SaveAgent(agent); err != nil {
		return err
	}
	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, "system", "register_agent", agent.ID, agent.Name)
	}
	return nil
}

func (o *AgentOrchestrator) ExecuteAgent(
	ctx context.Context,
	tenantID, agentID, correlationID string,
	input map[string]string,
	policy domain.AgentExecutionPolicy,
) (*domain.AgentExecution, error) {
	agent, err := o.agents.FindAgent(agentID)
	if err != nil {
		return nil, err
	}

	for tool := range input {
		if stringsHasToolPrefix(tool) {
			if err := policy.ValidateTool(tool); err != nil {
				return nil, err
			}
		}
	}

	exec := domain.AgentExecution{
		ExecutionID: fmt.Sprintf("exec-%d", time.Now().UnixNano()),
		TenantID:    tenantID,
		AgentID:     agent.ID,
		Status:      domain.ExecutionStatusRunning,
		CreatedAt:   time.Now(),
	}
	if err := o.execs.SaveExecution(exec); err != nil {
		return nil, err
	}
	if o.publisher != nil {
		_ = o.publisher.PublishEvent(ctx, "agent.execution.started", tenantID, "SVC-016", exec.ExecutionID)
	}

	exec.Status = domain.ExecutionStatusCompleted
	exec.Output = fmt.Sprintf("executed agent %s successfully", agent.Name)
	exec.TokensUsed = 128
	exec.CompletedAt = time.Now()
	_ = o.execs.SaveExecution(exec)

	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, tenantID, "execute_agent_completed", agentID, exec.ExecutionID)
	}
	return &exec, nil
}

func stringsHasToolPrefix(s string) bool {
	return len(s) > 5 && s[:5] == "tool_"
}

func (o *AgentOrchestrator) GetExecution(ctx context.Context, execID string) (*domain.AgentExecution, error) {
	return o.execs.GetExecution(execID)
}

func (o *AgentOrchestrator) StartWorkflow(
	ctx context.Context,
	tenantID, workflowID string,
	payload map[string]string,
) (*domain.WorkflowInstance, error) {
	wf := domain.WorkflowInstance{
		InstanceID:  fmt.Sprintf("wf-%d", time.Now().UnixNano()),
		TenantID:    tenantID,
		WorkflowID:  workflowID,
		Status:      "RUNNING",
		CurrentStep: "init",
		StartedAt:   time.Now(),
	}
	if err := o.workflows.SaveWorkflow(wf); err != nil {
		return nil, err
	}
	if o.publisher != nil {
		_ = o.publisher.PublishEvent(ctx, "workflow.runtime.started", tenantID, "SVC-143", wf.InstanceID)
	}
	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, tenantID, "start_workflow", workflowID, wf.InstanceID)
	}
	return &wf, nil
}

func (o *AgentOrchestrator) CancelWorkflow(
	ctx context.Context,
	tenantID, instanceID, reason string,
) error {
	wf, err := o.workflows.GetWorkflow(instanceID)
	if err != nil {
		return err
	}
	wf.Status = "CANCELLED"
	if err := o.workflows.SaveWorkflow(*wf); err != nil {
		return err
	}
	if o.publisher != nil {
		_ = o.publisher.PublishEvent(ctx, "workflow.runtime.cancelled", tenantID, "SVC-143", instanceID)
	}
	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, tenantID, "cancel_workflow", instanceID, reason)
	}
	return nil
}
