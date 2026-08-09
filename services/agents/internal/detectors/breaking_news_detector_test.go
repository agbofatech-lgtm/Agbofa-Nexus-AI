package detectors

import (
	"context"
	"errors"
	"testing"
	"time"

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
	signals   int
	detections int
}

func (m *mockEventBus) PublishSignalDetected(ctx context.Context, event *domain.MonitorSignalDetectedEvent) error {
	m.signals++
	return nil
}
func (m *mockEventBus) PublishTrendingTopic(ctx context.Context, event *domain.TrendingTopicFoundEvent) error {
	return nil
}
func (m *mockEventBus) PublishDetectionResult(ctx context.Context, event *domain.DetectionResultReadyEvent) error {
	m.detections++
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
	return "AI Summarized Breaking Event", 0.95, nil
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

func TestBreakingNewsDetector_InterfaceAndPriorityScoring(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewBreakingNewsDetector(ai, bus)

	if detector.ID() != "AGT-009" {
		t.Errorf("expected ID AGT-009, got %s", detector.ID())
	}
	if detector.Name() != "Breaking News Detector" {
		t.Errorf("expected Name Breaking News Detector, got %s", detector.Name())
	}
	if detector.Version() != "1.0.0" {
		t.Errorf("expected Version 1.0.0, got %s", detector.Version())
	}

	// 1. Cross-tenant Initialize check
	err := detector.Initialize(ctx, "", nil)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenantID, got %v", err)
	}

	// 2. Valid Initialize
	err = detector.Initialize(ctx, "tenant-det-1", map[string]string{"env": "test"})
	if err != nil {
		t.Fatalf("unexpected error initializing BreakingNewsDetector: %v", err)
	}

	// 3. HealthCheck
	health, err := detector.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Detect with priority scoring (C3 -> C2 -> C1)
	sig1 := &domain.MonitorSignal{
		SignalID: "sig-1",
		TenantID: "tenant-det-1",
		Author:   "source-1",
		Content:  "earthquake in region alpha",
		Platform: domain.PlatformTwitter,
	}
	res1, err := detector.Detect(ctx, sig1)
	if err != nil || res1.Metadata["priority"] != "C3" {
		t.Fatalf("expected C3 priority for single source, got %v (err=%v)", res1.Metadata["priority"], err)
	}

	// Add 3 more sources for same topic
	for i := 2; i <= 4; i++ {
		sig := &domain.MonitorSignal{
			SignalID: "sig-" + string(rune('0'+i)),
			TenantID: "tenant-det-1",
			Author:   "source-" + string(rune('0'+i)),
			Content:  "earthquake update reported",
			Platform: domain.PlatformFacebook,
		}
		_, _ = detector.Detect(ctx, sig)
	}
	sig5 := &domain.MonitorSignal{
		SignalID: "sig-5",
		TenantID: "tenant-det-1",
		Author:   "source-5",
		Content:  "earthquake magnitude confirmed",
		Platform: domain.PlatformLinkedIn,
	}
	res5, _ := detector.Detect(ctx, sig5)
	if res5.Metadata["priority"] != "C2" {
		t.Errorf("expected C2 priority for 5 unique sources, got %s", res5.Metadata["priority"])
	}

	// Add 2 more sources (>5 total) for C1
	for i := 6; i <= 7; i++ {
		sig := &domain.MonitorSignal{
			SignalID: "sig-" + string(rune('0'+i)),
			TenantID: "tenant-det-1",
			Author:   "source-" + string(rune('0'+i)),
			Content:  "earthquake emergency response",
			Platform: domain.PlatformYouTube,
		}
		_, _ = detector.Detect(ctx, sig)
	}
	sig8 := &domain.MonitorSignal{
		SignalID: "sig-8",
		TenantID: "tenant-det-1",
		Author:   "source-8",
		Content:  "earthquake rescue ongoing",
		Platform: domain.PlatformReddit,
	}
	res8, _ := detector.Detect(ctx, sig8)
	if res8.Metadata["priority"] != "C1" {
		t.Errorf("expected C1 priority for >5 unique sources, got %s", res8.Metadata["priority"])
	}

	if bus.detections < 8 {
		t.Errorf("expected at least 8 detection events published, got %d", bus.detections)
	}
}

func TestBreakingNewsDetector_AnalyzeAndClassify(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewBreakingNewsDetector(ai, bus)
	_ = detector.Initialize(ctx, "tenant-det-1", nil)

	sig := &domain.MonitorSignal{
		SignalID: "sig-analyse-1",
		TenantID: "tenant-det-1",
		Author:   "reporter_alpha",
		Content:  "Major storm approaching coast",
		URL:      "https://x.com/reporter/1001",
		Platform: domain.PlatformTwitter,
	}

	// 1. Analyze routes through AIGatewayService and extracts metadata
	res, err := detector.Analyze(ctx, sig)
	if err != nil || res == nil {
		t.Fatalf("unexpected error on Analyze: %v", err)
	}
	if res.Metadata["ai_summary"] != "AI Summarized Breaking Event" {
		t.Errorf("expected AI summary from gateway, got %s", res.Metadata["ai_summary"])
	}
	if res.Metadata["headline"] == "" || res.Metadata["location"] == "" || res.Metadata["casualty_impact_estimates"] == "" {
		t.Errorf("expected headline/location/impact estimates extracted, got metadata=%v", res.Metadata)
	}

	// 2. Classify returns DEVELOPING/BREAKING/CONFIRMED/RETRACTION
	classification, confidence, evidence, err := detector.Classify(ctx, sig)
	if err != nil || len(evidence) == 0 {
		t.Fatalf("unexpected error on Classify: %v", err)
	}
	if classification != "DEVELOPING" && classification != "BREAKING" && classification != "CONFIRMED" {
		t.Errorf("unexpected classification: %s", classification)
	}
	if confidence <= 0 || confidence > 1.0 {
		t.Errorf("confidence score out of bounds: %f", confidence)
	}

	// Test retraction classification
	retractSig := &domain.MonitorSignal{
		SignalID: "sig-retract-1",
		TenantID: "tenant-det-1",
		Author:   "reporter_alpha",
		Content:  "RETRACTION: previous report on storm was incorrect",
		Platform: domain.PlatformTwitter,
	}
	retractClass, _, _, _ := detector.Classify(ctx, retractSig)
	if retractClass != "RETRACTION" {
		t.Errorf("expected RETRACTION classification, got %s", retractClass)
	}
}
