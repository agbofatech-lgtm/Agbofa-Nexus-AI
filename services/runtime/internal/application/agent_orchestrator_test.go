package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/runtime/internal/application"
	"github.com/agbofa/nexus/services/runtime/internal/domain"
)

type inMemAgentRepo struct {
	agents map[string]domain.AgentDefinition
}

func newInMemAgentRepo() *inMemAgentRepo {
	return &inMemAgentRepo{agents: make(map[string]domain.AgentDefinition)}
}

func (r *inMemAgentRepo) FindAgent(id string) (*domain.AgentDefinition, error) {
	a, ok := r.agents[id]
	if !ok {
		return nil, domain.ErrAgentNotFound
	}
	return &a, nil
}

func (r *inMemAgentRepo) SaveAgent(a domain.AgentDefinition) error {
	r.agents[a.ID] = a
	return nil
}

type inMemExecutionRepo struct {
	execs map[string]domain.AgentExecution
}

func newInMemExecutionRepo() *inMemExecutionRepo {
	return &inMemExecutionRepo{execs: make(map[string]domain.AgentExecution)}
}

func (r *inMemExecutionRepo) SaveExecution(e domain.AgentExecution) error {
	r.execs[e.ExecutionID] = e
	return nil
}

func (r *inMemExecutionRepo) GetExecution(id string) (*domain.AgentExecution, error) {
	e, ok := r.execs[id]
	if !ok {
		return nil, domain.ErrExecutionNotFound
	}
	return &e, nil
}

type inMemWorkflowRepo struct {
	wfs map[string]domain.WorkflowInstance
}

func newInMemWorkflowRepo() *inMemWorkflowRepo {
	return &inMemWorkflowRepo{wfs: make(map[string]domain.WorkflowInstance)}
}

func (r *inMemWorkflowRepo) SaveWorkflow(w domain.WorkflowInstance) error {
	r.wfs[w.InstanceID] = w
	return nil
}

func (r *inMemWorkflowRepo) GetWorkflow(id string) (*domain.WorkflowInstance, error) {
	w, ok := r.wfs[id]
	if !ok {
		return nil, domain.ErrWorkflowNotFound
	}
	return &w, nil
}

type mockEventPublisher struct {
	events []string
}

func (m *mockEventPublisher) PublishEvent(ctx context.Context, eventType, tenantID, source, payload string) error {
	m.events = append(m.events, eventType+":"+source)
	return nil
}

func TestAgentOrchestrator_ExecuteAgent(t *testing.T) {
	agents := newInMemAgentRepo()
	execs := newInMemExecutionRepo()
	wfs := newInMemWorkflowRepo()
	pub := &mockEventPublisher{}

	orch := application.NewAgentOrchestrator(agents, execs, wfs, pub, nil)

	if err := orch.RegisterAgent(context.Background(), domain.AgentDefinition{
		ID:           "agent-01",
		Name:         "Research Agent",
		AllowedTools: []string{"tool_search"},
	}); err != nil {
		t.Fatalf("failed to register agent: %v", err)
	}

	exec, err := orch.ExecuteAgent(
		context.Background(),
		"tenant-1",
		"agent-01",
		"corr-100",
		map[string]string{"tool_search": "AI media trends"},
		domain.AgentExecutionPolicy{
			AllowedTools: map[string]bool{"tool_search": true},
		},
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if exec.Status != domain.ExecutionStatusCompleted {
		t.Fatalf("expected completed status, got %s", exec.Status)
	}
	if len(pub.events) == 0 {
		t.Fatalf("expected events published, got 0")
	}
}

func TestAgentOrchestrator_UnauthorizedTool(t *testing.T) {
	agents := newInMemAgentRepo()
	execs := newInMemExecutionRepo()
	wfs := newInMemWorkflowRepo()

	orch := application.NewAgentOrchestrator(agents, execs, wfs, nil, nil)
	_ = orch.RegisterAgent(context.Background(), domain.AgentDefinition{
		ID:   "agent-02",
		Name: "Simple Agent",
	})

	_, err := orch.ExecuteAgent(
		context.Background(),
		"tenant-1",
		"agent-02",
		"corr-101",
		map[string]string{"tool_exec_sql": "SELECT *"},
		domain.AgentExecutionPolicy{
			AllowedTools: map[string]bool{"tool_search": true},
		},
	)
	if !errors.Is(err, domain.ErrUnauthorizedTool) {
		t.Fatalf("expected ErrUnauthorizedTool, got %v", err)
	}
}

func TestAgentOrchestrator_WorkflowLifecycle(t *testing.T) {
	agents := newInMemAgentRepo()
	execs := newInMemExecutionRepo()
	wfs := newInMemWorkflowRepo()
	pub := &mockEventPublisher{}

	orch := application.NewAgentOrchestrator(agents, execs, wfs, pub, nil)

	wf, err := orch.StartWorkflow(context.Background(), "tenant-1", "wf-intake-01", map[string]string{"source": "rss"})
	if err != nil {
		t.Fatalf("failed to start workflow: %v", err)
	}
	if wf.Status != "RUNNING" {
		t.Fatalf("expected status RUNNING, got %s", wf.Status)
	}

	if err := orch.CancelWorkflow(context.Background(), "tenant-1", wf.InstanceID, "user request"); err != nil {
		t.Fatalf("failed to cancel workflow: %v", err)
	}

	updated, _ := wfs.GetWorkflow(wf.InstanceID)
	if updated.Status != "CANCELLED" {
		t.Fatalf("expected status CANCELLED, got %s", updated.Status)
	}
}
