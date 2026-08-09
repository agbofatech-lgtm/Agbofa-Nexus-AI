package pipeline

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockNeo4jClient struct {
	err error
}

func (m *mockNeo4jClient) UpdateStoryGraph(ctx context.Context, tenantID, storyID string, verification domain.VerificationResult) error {
	return m.err
}

type mockPhase1Client struct {
	err error
}

func (m *mockPhase1Client) RouteToContentFactory(ctx context.Context, tenantID, storyID string, metadata map[string]string) error {
	return m.err
}

func (m *mockPhase1Client) CheckCompliance(ctx context.Context, tenantID, contentID string) (bool, string, error) {
	if m.err != nil {
		return false, "", m.err
	}
	return true, "Cleared compliance screening", nil
}

func (m *mockPhase1Client) ScheduleDistribution(ctx context.Context, tenantID, contentID string, platforms []string) error {
	return m.err
}

func (m *mockPhase1Client) CollectAnalytics(ctx context.Context, tenantID, contentID string) (map[string]interface{}, error) {
	if m.err != nil {
		return nil, m.err
	}
	return map[string]interface{}{"views": 1000}, nil
}

func (m *mockPhase1Client) MonitorServiceHealth(ctx context.Context, serviceID string) (bool, error) {
	return true, nil
}

func TestContentPipelineAgentExecuteSuccess(t *testing.T) {
	tenantID := "tenant-test"
	neo4j := &mockNeo4jClient{}
	phase1 := &mockPhase1Client{}

	agent := NewContentIngestionOrchestratorAgent(tenantID, phase1)
	res, err := agent.ExecutePipeline(context.Background(), map[string]string{"tenant_id": tenantID})
	if err != nil {
		t.Fatalf("expected pipeline execute success, got %v", err)
	}
	if res.Status != domain.PipelineStatusSuccess || res.Stage != domain.PipelineStageIngestion {
		t.Fatalf("unexpected pipeline result: %v", res)
	}

	graphAgent := NewStoryGraphUpdaterAgent(tenantID, neo4j, phase1)
	graphRes, err := graphAgent.ExecutePipeline(context.Background(), map[string]string{"tenant_id": tenantID, "story_id": "story-100"})
	if err != nil {
		t.Fatalf("expected story graph updater success, got %v", err)
	}
	if graphRes.Stage != domain.PipelineStageStoryGraph {
		t.Fatalf("unexpected graph update stage")
	}
}

func TestQuarantineGate(t *testing.T) {
	tenantID := "tenant-test"
	phase1 := &mockPhase1Client{}

	agt28 := NewCompliancePreCheckerAgent(tenantID, phase1)
	payload := map[string]string{
		"tenant_id":        tenantID,
		"content_id":       "cnt-anom",
		"anomaly_severity": "0.85",
	}

	res28, err := agt28.ExecutePipeline(context.Background(), payload)
	if err != nil {
		t.Fatalf("expected compliance pre-checker success, got %v", err)
	}
	if payload["content_status"] != "QUARANTINED" {
		t.Fatalf("expected status QUARANTINED when anomaly severity > 0.80, got %s", payload["content_status"])
	}
	_ = res28

	agt29 := NewDistributionSchedulerAgent(tenantID, phase1)
	res29, err := agt29.ExecutePipeline(context.Background(), payload)
	if err != nil {
		t.Fatalf("expected distribution scheduler success, got %v", err)
	}
	if res29.OutputPayload != "Distribution skipped: content is QUARANTINED due to anomaly detection" {
		t.Fatalf("expected distribution skip for quarantined content, got %s", res29.OutputPayload)
	}
}

func TestKillSwitchCircuitBreaker(t *testing.T) {
	cb := NewFleetCircuitBreaker()
	agentID := "AGT-001"

	// Record 4 errors out of 5 -> error rate > 50% -> circuit OPEN
	cb.RecordExecution(agentID, true)
	cb.RecordExecution(agentID, true)
	cb.RecordExecution(agentID, true)
	cb.RecordExecution(agentID, false)
	state, msg := cb.RecordExecution(agentID, true)
	if state != domain.CircuitBreakerOpen {
		t.Fatalf("expected OPEN circuit breaker after >50%% errors, got %s (%s)", state, msg)
	}
	if cb.GetState(agentID) != domain.CircuitBreakerOpen {
		t.Fatalf("expected GetState to return OPEN")
	}
}

func TestContentPipelineAgentCrossTenantViolation(t *testing.T) {
	tenantID := "tenant-test"
	phase1 := &mockPhase1Client{}

	agent := NewCompliancePreCheckerAgent(tenantID, phase1)
	_, err := agent.ExecutePipeline(context.Background(), map[string]string{"tenant_id": "other-tenant"})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}
}

func TestContentPipelineAgentAllStages(t *testing.T) {
	tenantID := "tenant-test"
	neo4j := &mockNeo4jClient{}
	phase1 := &mockPhase1Client{}

	all := CreateAllPipelineAgents(tenantID, neo4j, phase1)
	if len(all) != 8 {
		t.Fatalf("expected 8 pipeline agents (AGT-025 to AGT-032), got %d", len(all))
	}

	expectedIDs := []string{"AGT-025", "AGT-026", "AGT-027", "AGT-028", "AGT-029", "AGT-030", "AGT-031", "AGT-032"}
	for _, id := range expectedIDs {
		if _, ok := all[id]; !ok {
			t.Fatalf("expected pipeline ID %s in registry map", id)
		}
	}
}
