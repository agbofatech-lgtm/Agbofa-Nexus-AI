package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockPipelineAgent struct {
	id       string
	tenantID string
	stage    domain.PipelineStage
	err      error
}

func (m *mockPipelineAgent) ID() string                 { return m.id }
func (m *mockPipelineAgent) Name() string               { return "Mock Pipeline Agent" }
func (m *mockPipelineAgent) TenantID() string           { return m.tenantID }
func (m *mockPipelineAgent) Status() domain.AgentStatus { return domain.AgentStatusActive }
func (m *mockPipelineAgent) Stage() domain.PipelineStage { return m.stage }
func (m *mockPipelineAgent) UpstreamAgents() []string   { return nil }
func (m *mockPipelineAgent) DownstreamAgents() []string { return nil }
func (m *mockPipelineAgent) ExecutePipeline(ctx context.Context, payload map[string]string) (*domain.PipelineResult, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.PipelineResult{
		ExecutionID:   "exec-mock-orch",
		TenantID:      m.tenantID,
		AgentID:       m.id,
		Stage:         m.stage,
		Status:        domain.PipelineStatusSuccess,
		OutputPayload: "Pipeline stage completed successfully",
		ExecutedAt:    time.Now(),
	}, nil
}
func (m *mockPipelineAgent) Execute(ctx context.Context, executionContext map[string]string) error {
	return nil
}

type mockPipelinePublisher struct {
	complianceEvents int
	executionEvents  int
}

func (m *mockPipelinePublisher) PublishSignalDetected(ctx context.Context, event *domain.MonitorSignalDetectedEvent) error {
	return nil
}
func (m *mockPipelinePublisher) PublishTrendingTopic(ctx context.Context, event *domain.TrendingTopicFoundEvent) error {
	return nil
}
func (m *mockPipelinePublisher) PublishDetectionResult(ctx context.Context, event *domain.DetectionResultReadyEvent) error {
	return nil
}
func (m *mockPipelinePublisher) PublishVerificationCompleted(ctx context.Context, event *domain.VerificationCompletedEvent) error {
	return nil
}
func (m *mockPipelinePublisher) PublishComplianceClearance(ctx context.Context, event *domain.ComplianceClearanceEvent) error {
	m.complianceEvents++
	return nil
}
func (m *mockPipelinePublisher) PublishPipelineExecution(ctx context.Context, event *domain.PipelineExecutionEvent) error {
	m.executionEvents++
	return nil
}

type mockNeo4jSagaClient struct {
	rollbackCount int
}

func (m *mockNeo4jSagaClient) UpdateStoryGraph(ctx context.Context, tenantID, storyID string, verification domain.VerificationResult) error {
	return nil
}
func (m *mockNeo4jSagaClient) RollbackStoryGraph(ctx context.Context, tenantID, storyID string) error {
	m.rollbackCount++
	return nil
}

func TestPipelineOrchestratorExecuteStageAndEvents(t *testing.T) {
	tenantID := "tenant-orch-test"
	agent := &mockPipelineAgent{
		id:       "AGT-028",
		tenantID: tenantID,
		stage:    domain.PipelineStageCompliance,
	}
	publisher := &mockPipelinePublisher{}

	orch := NewPipelineOrchestrator(publisher, nil, nil)
	req := PipelineRequestDTO{
		TenantID: tenantID,
		AgentID:  "AGT-028",
		Stage:    "COMPLIANCE",
		Payload:  map[string]string{"content_id": "cnt-123"},
	}

	resp, err := orch.ExecutePipelineStage(context.Background(), agent, req)
	if err != nil {
		t.Fatalf("expected pipeline stage success, got %v", err)
	}
	if resp.Result.Status != domain.PipelineStatusSuccess {
		t.Fatalf("unexpected status: %s", resp.Result.Status)
	}
	if publisher.complianceEvents != 1 {
		t.Fatalf("expected 1 EVT-025 compliance clearance event, got %d", publisher.complianceEvents)
	}
	if publisher.executionEvents != 1 {
		t.Fatalf("expected 1 EVT-045 pipeline execution event, got %d", publisher.executionEvents)
	}
}

func TestPipelineSagaCompensatingRollback(t *testing.T) {
	tenantID := "tenant-orch-test"
	storyID := "story-saga-100"
	sagaClient := &mockNeo4jSagaClient{}
	orch := NewPipelineOrchestrator(nil, nil, sagaClient)

	// Step 1: Execute AGT-026 Story Graph Updater successfully
	agt26 := &mockPipelineAgent{
		id:       "AGT-026",
		tenantID: tenantID,
		stage:    domain.PipelineStageStoryGraph,
	}
	_, err := orch.ExecutePipelineStage(context.Background(), agt26, PipelineRequestDTO{
		TenantID: tenantID,
		AgentID:  "AGT-026",
		Stage:    "STORY_GRAPH",
		Payload:  map[string]string{"story_id": storyID},
	})
	if err != nil {
		t.Fatalf("expected AGT-026 execute success, got %v", err)
	}

	// Step 2: Execute downstream AGT-027 Factory Intake Router with an ERROR!
	agt27 := &mockPipelineAgent{
		id:       "AGT-027",
		tenantID: tenantID,
		stage:    domain.PipelineStageFactory,
		err:      errors.New("factory intake unreachable"),
	}
	_, err = orch.ExecutePipelineStage(context.Background(), agt27, PipelineRequestDTO{
		TenantID: tenantID,
		AgentID:  "AGT-027",
		Stage:    "CONTENT_FACTORY",
		Payload:  map[string]string{"story_id": storyID},
	})
	if err == nil {
		t.Fatalf("expected error from AGT-027 execution")
	}

	// Verify that compensating saga rollback was invoked exactly once!
	if sagaClient.rollbackCount != 1 {
		t.Fatalf("expected 1 compensating saga rollback on Neo4j, got %d", sagaClient.rollbackCount)
	}
}

func TestPipelineBackpressureQueue(t *testing.T) {
	orch := NewPipelineOrchestrator(nil, nil, nil)
	tenantID := "tenant-alpha"
	orch.RegisterAgent(&mockPipelineAgent{id: "AGT-025", tenantID: tenantID})

	for i := 0; i < 1000; i++ {
		err := orch.SubmitPipelineRequestAsync(PipelineRequestDTO{
			TenantID: tenantID,
			AgentID:  "AGT-025",
			Stage:    "INGESTION",
			Payload:  map[string]string{"item": "1"},
		})
		if err != nil {
			t.Fatalf("unexpected error filling queue at index %d: %v", i, err)
		}
	}
	err := orch.SubmitPipelineRequestAsync(PipelineRequestDTO{
		TenantID: tenantID,
		AgentID:  "AGT-025",
		Stage:    "INGESTION",
		Payload:  map[string]string{"item": "overflow"},
	})
	if !errors.Is(err, domain.ErrPipelineOverloaded) {
		t.Fatalf("expected ErrPipelineOverloaded when queue is full, got %v", err)
	}
}

func TestDurablePipelineCheckpointsAndCleanup(t *testing.T) {
	tenantID := "tenant-orch-test"
	agent := &mockPipelineAgent{
		id:       "AGT-025",
		tenantID: tenantID,
		stage:    domain.PipelineStageIngestion,
	}
	orch := NewPipelineOrchestrator(nil, nil, nil)

	_, err := orch.ExecutePipelineStage(context.Background(), agent, PipelineRequestDTO{
		TenantID: tenantID,
		AgentID:  "AGT-025",
		Stage:    "INGESTION",
		Payload:  map[string]string{"key": "value"},
	})
	if err != nil {
		t.Fatalf("expected execute success, got %v", err)
	}

	inProg, err := orch.ResumeIncompleteCheckpoints(context.Background(), tenantID)
	if err != nil || len(inProg) != 0 {
		t.Fatalf("expected 0 in-progress checkpoints after successful stage, got %d", len(inProg))
	}

	orch.mu.Lock()
	orch.checkpoints["old-chk"] = &domain.PipelineState{
		StateID:          "old-chk",
		TenantID:         tenantID,
		CheckpointStatus: domain.CheckpointStatusInProgress,
		LastUpdated:      time.Now().Add(-10 * 24 * time.Hour),
	}
	orch.mu.Unlock()

	cleaned := orch.CleanupExpiredCheckpoints(context.Background(), 7*24*time.Hour)
	if cleaned != 1 {
		t.Fatalf("expected 1 expired checkpoint cleaned, got %d", cleaned)
	}
}

func TestPipelineOrchestratorCheckFleetHealth(t *testing.T) {
	tenantID := "tenant-orch-test"
	orch := NewPipelineOrchestrator(nil, nil, nil)
	orch.RegisterAgent(&mockPipelineAgent{id: "AGT-025", tenantID: tenantID})

	report, err := orch.CheckFleetHealth(context.Background(), tenantID)
	if err != nil {
		t.Fatalf("expected fleet health check success, got %v", err)
	}
	if report.TotalAgents != 1 || report.ActiveAgents != 1 || !report.Phase1ServicesOK {
		t.Fatalf("unexpected fleet health report: %v", report)
	}
}
