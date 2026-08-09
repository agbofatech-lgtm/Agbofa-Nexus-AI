package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockAgent struct {
	id       string
	tenantID string
	platform domain.PlatformSource
	signals  []domain.MonitorSignal
	err      error
}

func (m *mockAgent) ID() string                    { return m.id }
func (m *mockAgent) Name() string                  { return "Mock Agent" }
func (m *mockAgent) TenantID() string              { return m.tenantID }
func (m *mockAgent) Status() domain.AgentStatus    { return domain.AgentStatusActive }
func (m *mockAgent) Platform() domain.PlatformSource { return m.platform }
func (m *mockAgent) Scan(ctx context.Context, tenantID string, keywords []string) ([]domain.MonitorSignal, error) {
	return m.signals, m.err
}
func (m *mockAgent) GetRateLimitStatus(ctx context.Context) (int, error) { return 500, nil }
func (m *mockAgent) Execute(ctx context.Context, executionContext map[string]string) error {
	return nil
}

type mockPublisher struct {
	signalCount int
	topicCount  int
}

func (m *mockPublisher) PublishSignalDetected(ctx context.Context, event *domain.MonitorSignalDetectedEvent) error {
	m.signalCount++
	return nil
}
func (m *mockPublisher) PublishTrendingTopic(ctx context.Context, event *domain.TrendingTopicFoundEvent) error {
	m.topicCount++
	return nil
}

type mockAIGateway struct{}

func (a *mockAIGateway) SummarizeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (string, float64, error) {
	return "Mock AI summary", 95.0, nil
}
func (a *mockAIGateway) ScoreTrendingTopic(ctx context.Context, tenantID, agentID string, topic *domain.TrendingTopic) (float64, error) {
	return 88.5, nil
}

func TestOrchestratorExecuteScanWithAIGatewayAndPublisher(t *testing.T) {
	tenantID := "tenant-test"
	agent := &mockAgent{
		id:       "AGT-001",
		tenantID: tenantID,
		platform: domain.PlatformTwitter,
		signals: []domain.MonitorSignal{
			{SignalID: "s-1", TenantID: tenantID, Author: "@tech", Content: "Breakthrough AI", DetectedAt: time.Now()},
		},
	}
	publisher := &mockPublisher{}
	aiGateway := &mockAIGateway{}

	orchestrator := NewMonitorOrchestrator(nil, publisher).WithAIGateway(aiGateway)
	resp, err := orchestrator.ExecuteScan(context.Background(), agent, ScanRequestDTO{
		TenantID: tenantID,
		AgentID:  "AGT-001",
		Keywords: []string{"ai"},
	})
	if err != nil {
		t.Fatalf("expected scan success, got %v", err)
	}
	if resp.SignalsCount != 1 || len(resp.Signals) != 1 {
		t.Fatalf("expected 1 signal, got %d", resp.SignalsCount)
	}
	if resp.Signals[0].Metadata["ai_summary"] != "Mock AI summary" {
		t.Fatalf("expected ai_summary metadata, got %s", resp.Signals[0].Metadata["ai_summary"])
	}
	if publisher.signalCount != 1 {
		t.Fatalf("expected 1 published event, got %d", publisher.signalCount)
	}
}

func TestAdversarialFloodProtection(t *testing.T) {
	tenantID := "tenant-test"
	signals := make([]domain.MonitorSignal, 60)
	for i := 0; i < 60; i++ {
		signals[i] = domain.MonitorSignal{SignalID: "sig-flood", TenantID: tenantID}
	}
	agent := &mockAgent{
		id:       "AGT-001",
		tenantID: tenantID,
		platform: domain.PlatformTwitter,
		signals:  signals,
	}
	fd := NewFloodDetector(50, 5*time.Minute)
	orch := NewMonitorOrchestrator(nil, nil).WithFloodDetector(fd)

	_, err := orch.ExecuteScan(context.Background(), agent, ScanRequestDTO{
		TenantID: tenantID,
		AgentID:  "AGT-001",
		Keywords: []string{"spam"},
	})
	if !errors.Is(err, domain.ErrFloodDetected) {
		t.Fatalf("expected ErrFloodDetected when signals exceed threshold, got %v", err)
	}
	if len(fd.GetAuditTrail()) == 0 {
		t.Fatalf("expected flood event recorded in audit trail")
	}
}

func TestOrchestratorCheckHealth(t *testing.T) {
	agent := &mockAgent{id: "AGT-002", tenantID: "tenant-test", platform: domain.PlatformFacebook}
	orchestrator := NewMonitorOrchestrator(nil, nil)
	report, err := orchestrator.CheckHealth(context.Background(), agent)
	if err != nil {
		t.Fatalf("expected check health success, got %v", err)
	}
	if report.RemainingQuota != 500 || report.AgentID != "AGT-002" {
		t.Fatalf("unexpected health report: %v", report)
	}
}
