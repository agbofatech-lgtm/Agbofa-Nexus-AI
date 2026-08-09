package platforms

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockAuditLogger struct {
	events []string
}

func (m *mockAuditLogger) LogEvent(ctx context.Context, tenantID, action, resource, details string) error {
	m.events = append(m.events, action+":"+resource)
	return nil
}

type mockEventBus struct {
	signals int
}

func (m *mockEventBus) PublishSignalDetected(ctx context.Context, event *domain.MonitorSignalDetectedEvent) error {
	m.signals++
	return nil
}
func (m *mockEventBus) PublishTrendingTopic(ctx context.Context, event *domain.TrendingTopicFoundEvent) error {
	return nil
}
func (m *mockEventBus) PublishDetectionResult(ctx context.Context, event *domain.DetectionResultReadyEvent) error {
	return nil
}
func (m *mockEventBus) PublishVerificationCompleted(ctx context.Context, event *domain.VerificationCompletedEvent) error {
	return nil
}
func (m *mockEventBus) PublishComplianceClearance(ctx context.Context, event *domain.ComplianceClearanceEvent) error {
	return nil
}
func (m *mockEventBus) PublishPipelineExecution(ctx context.Context, event *domain.PipelineExecutionEvent) error {
	return nil
}
func (m *mockEventBus) PublishPredictionIntelligence(ctx context.Context, event *domain.PredictiveIntelligenceEvent) error {
	return nil
}
func (m *mockEventBus) PublishBehavioralSignal(ctx context.Context, tenantID string, event *domain.BehavioralSignalRecordedEvent) error {
	return nil
}
func (m *mockEventBus) PublishPersonalizedFeed(ctx context.Context, tenantID string, event *domain.PersonalizedFeedGeneratedEvent) error {
	return nil
}
func (m *mockEventBus) PublishPreferenceUpdate(ctx context.Context, tenantID string, event *domain.PreferenceModelUpdatedEvent) error {
	return nil
}

type mockAIGateway struct {
	summarized int
}

func (m *mockAIGateway) SummarizeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (string, float64, error) {
	m.summarized++
	return "AI Summary of Tweet", 0.95, nil
}
func (m *mockAIGateway) ScoreTrendingTopic(ctx context.Context, tenantID, agentID string, topic *domain.TrendingTopic) (float64, error) {
	return 0.8, nil
}
func (m *mockAIGateway) AnalyzeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (*domain.DetectionResult, error) {
	return nil, nil
}
func (m *mockAIGateway) VerifyDetection(ctx context.Context, tenantID, agentID string, detection *domain.DetectionResult) (*domain.VerificationResult, error) {
	return nil, nil
}
func (m *mockAIGateway) PredictVirality(ctx context.Context, tenantID, storyID string, metadata map[string]string) (*domain.ViralityPrediction, error) {
	return nil, nil
}
func (m *mockAIGateway) OptimizeEngagement(ctx context.Context, tenantID, contentID string, metadata map[string]string) (*domain.EngagementOptimization, error) {
	return nil, nil
}
func (m *mockAIGateway) ModelTrendLifecycle(ctx context.Context, tenantID, topicID string, metadata map[string]string) (*domain.TrendLifecycleModel, error) {
	return nil, nil
}
func (m *mockAIGateway) ForecastPerformance(ctx context.Context, tenantID, contentID string, metadata map[string]string) (*domain.ContentPerformanceForecast, error) {
	return nil, nil
}
func (m *mockAIGateway) DetectAnomalies(ctx context.Context, tenantID string, platform domain.PlatformSource, metadata map[string]string) (*domain.AnomalyDetectionEvent, error) {
	return nil, nil
}

type mockRateLimiter struct {
	allow bool
}

func (m *mockRateLimiter) Allow(ctx context.Context, platform domain.PlatformSource, tenantID string) (bool, error) {
	return m.allow, nil
}
func (m *mockRateLimiter) Remaining(ctx context.Context, platform domain.PlatformSource, tenantID string) (int, error) {
	if m.allow {
		return 15, nil
	}
	return 0, nil
}

func TestXAdapter_PlatformConnectorMethods(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewXAdapter(ai, bus, limiter, logger)

	if adapter.PlatformName() != "X" {
		t.Errorf("expected PlatformName X, got %s", adapter.PlatformName())
	}
	if adapter.ConnectorVersion() != "1.0.0" {
		t.Errorf("expected version 1.0.0, got %s", adapter.ConnectorVersion())
	}
	types := adapter.SupportedContentTypes()
	if len(types) != 4 || types[0] != ContentTypeText {
		t.Errorf("expected 4 supported content types starting with TEXT, got %v", types)
	}

	// 1. Initialize with missing credentials
	err := adapter.Initialize(ctx, ConnectorConfig{"tenant_id": "tenant-x"})
	if !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials on missing API key, got %v", err)
	}

	// 2. Initialize with valid credentials
	err = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id": "tenant-x",
		"api_key":   "x-key-secret",
	})
	if err != nil {
		t.Fatalf("unexpected error initializing XAdapter: %v", err)
	}

	// 3. HealthCheck
	health, err := adapter.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Publish
	pubRes, err := adapter.Publish(ctx, &PlatformContent{
		Content:  "Hello from Agbofa Nexus AI",
		TenantID: "tenant-x",
		Platform: "X",
	})
	if err != nil || pubRes.Status != "PUBLISHED" {
		t.Fatalf("expected published tweet result, got %v (err=%v)", pubRes, err)
	}
	if adapter.GetRemainingQuota() != 14 {
		t.Errorf("expected quota decremented to 14, got %d", adapter.GetRemainingQuota())
	}

	// 5. Update (not supported by X API v2)
	_, err = adapter.Update(ctx, "post-100", &PlatformContent{TenantID: "tenant-x"})
	if err == nil || err.Error() != "update not supported by X API v2" {
		t.Fatalf("expected unsupported error on update, got %v", err)
	}

	// 6. Delete
	err = adapter.Delete(ctx, pubRes.PostID)
	if err != nil {
		t.Fatalf("unexpected error deleting tweet: %v", err)
	}

	// 7. GetStatus
	status, err := adapter.GetStatus(ctx, pubRes.PostID)
	if err != nil || status.Metrics["likes"] != 120 {
		t.Fatalf("expected tweet metrics with 120 likes, got %v (err=%v)", status, err)
	}
}

func TestXAdapter_TenantIsolationAndRateLimiting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewXAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id": "tenant-x",
		"api_key":   "x-key-secret",
	})

	// 1. Cross-tenant violation
	_, err := adapter.Publish(ctx, &PlatformContent{
		Content:  "Cross-tenant attempt",
		TenantID: "tenant-intruder",
		Platform: "X",
	})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}

	// 2. Quota exhaustion
	adapter.SetRemainingQuota(0)
	_, err = adapter.Publish(ctx, &PlatformContent{
		Content:  "Quota exhausted tweet",
		TenantID: "tenant-x",
		Platform: "X",
	})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded, got %v", err)
	}

	// 3. Fetch with rate limiter denial
	adapter.SetRemainingQuota(15)
	limiter.allow = false
	_, err = adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-x",
		SourceID: "X",
	})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded on Fetch denial, got %v", err)
	}
}

func TestXAdapter_FetchAndAIGatewayRouting(t *testing.T) {
	ctx := context.Background()
	logger := &mockAuditLogger{}
	ai := &mockAIGateway{}
	bus := &mockEventBus{}
	limiter := &mockRateLimiter{allow: true}

	adapter := NewXAdapter(ai, bus, limiter, logger)
	_ = adapter.Initialize(ctx, ConnectorConfig{
		"tenant_id": "tenant-x",
		"api_key":   "x-key-secret",
	})

	res, err := adapter.Fetch(ctx, domain.FetchOptions{
		TenantID: "tenant-x",
		SourceID: "X",
		Limit:    5,
	})
	if err != nil || res == nil || len(res.Documents) != 1 {
		t.Fatalf("expected 1 monitoring document from XAdapter Fetch, got res=%v (err=%v)", res, err)
	}

	if ai.summarized != 1 {
		t.Errorf("expected AIGatewayService SummarizeSignal called once, got %d", ai.summarized)
	}
	if bus.signals != 1 {
		t.Errorf("expected EventPublisher PublishSignalDetected called once, got %d", bus.signals)
	}
	if res.Documents[0].Metadata["ai_summary"] != "AI Summary of Tweet" {
		t.Errorf("expected ai_summary metadata set, got %s", res.Documents[0].Metadata["ai_summary"])
	}
}
