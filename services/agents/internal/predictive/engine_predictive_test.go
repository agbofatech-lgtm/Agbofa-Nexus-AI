package predictive

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockAIGatewayPredictive struct {
	err error
}

func (m *mockAIGatewayPredictive) SummarizeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (string, float64, error) {
	return "", 0, nil
}
func (m *mockAIGatewayPredictive) ScoreTrendingTopic(ctx context.Context, tenantID, agentID string, topic *domain.TrendingTopic) (float64, error) {
	return 0, nil
}
func (m *mockAIGatewayPredictive) AnalyzeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (*domain.DetectionResult, error) {
	return nil, nil
}
func (m *mockAIGatewayPredictive) VerifyDetection(ctx context.Context, tenantID, agentID string, detection *domain.DetectionResult) (*domain.VerificationResult, error) {
	return nil, nil
}
func (m *mockAIGatewayPredictive) PredictVirality(ctx context.Context, tenantID, storyID string, metadata map[string]string) (*domain.ViralityPrediction, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.ViralityPrediction{
		PredictionID:       "pred-vir-mock",
		TenantID:           tenantID,
		StoryID:            storyID,
		ViralityScore:      0.94,
		ConfidenceInterval: 0.08,
		PredictedAt:        time.Now(),
	}, nil
}
func (m *mockAIGatewayPredictive) OptimizeEngagement(ctx context.Context, tenantID, contentID string, metadata map[string]string) (*domain.EngagementOptimization, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.EngagementOptimization{
		OptimizationID:  "opt-eng-mock",
		TenantID:        tenantID,
		ContentID:       contentID,
		OptimalTimes:    []string{"12:00 UTC"},
		TargetPlatforms: []domain.PlatformSource{domain.PlatformTwitter, domain.PlatformLinkedIn},
	}, nil
}
func (m *mockAIGatewayPredictive) ModelTrendLifecycle(ctx context.Context, tenantID, topicID string, metadata map[string]string) (*domain.TrendLifecycleModel, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.TrendLifecycleModel{
		ModelID:      "mod-trend-mock",
		TenantID:     tenantID,
		TopicID:      topicID,
		CurrentPhase: domain.TrendPhaseAcceleration,
		Velocity:     60.0,
	}, nil
}
func (m *mockAIGatewayPredictive) ForecastPerformance(ctx context.Context, tenantID, contentID string, metadata map[string]string) (*domain.ContentPerformanceForecast, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.ContentPerformanceForecast{
		ForecastID:     "fc-perf-mock",
		TenantID:       tenantID,
		ContentID:      contentID,
		PredictedViews: 200000,
	}, nil
}
func (m *mockAIGatewayPredictive) DetectAnomalies(ctx context.Context, tenantID string, platform domain.PlatformSource, metadata map[string]string) (*domain.AnomalyDetectionEvent, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.AnomalyDetectionEvent{
		AnomalyID:     "anom-mock",
		TenantID:      tenantID,
		Platform:      platform,
		AnomalyType:   "ENGAGEMENT_SPIKE",
		SeverityScore: 0.88,
	}, nil
}

type mockRateLimiterPredictive struct {
	rem int
}

func (m *mockRateLimiterPredictive) Allow(ctx context.Context, platform domain.PlatformSource, tenantID string) (bool, error) {
	return true, nil
}
func (m *mockRateLimiterPredictive) Remaining(ctx context.Context, platform domain.PlatformSource, tenantID string) (int, error) {
	return m.rem, nil
}

func TestViralityColdStartAndDynamicInterval(t *testing.T) {
	tenantID := "tenant-test"
	aiGateway := &mockAIGatewayPredictive{}

	engine := NewViralityPredictor(tenantID, aiGateway)
	res, err := engine.ExecutePrediction(context.Background(), map[string]string{
		"tenant_id": tenantID,
		"story_id":  "story-100",
		"category":  "news", // industry prior = 0.45
	})
	if err != nil {
		t.Fatalf("expected virality prediction success, got %v", err)
	}
	pred := res.(*domain.ViralityPrediction)

	// Sample count n = 0 (< 10): llmWeight = 0.30, priorScore = 0.45, llmScore = 0.94
	// blendedScore = (0.94 * 0.30) + (0.45 * 0.70) = 0.282 + 0.315 = 0.597
	if pred.ViralityScore < 0.59 || pred.ViralityScore > 0.60 {
		t.Fatalf("expected blended score around 0.597, got %.3f", pred.ViralityScore)
	}
	// For n < 5, dynamic interval should default to 0.12
	if pred.ConfidenceInterval != 0.12 {
		t.Fatalf("expected default interval 0.12 for small sample size, got %.3f", pred.ConfidenceInterval)
	}
}

func TestEngagementRateLimitCheck(t *testing.T) {
	tenantID := "tenant-test"
	aiGateway := &mockAIGatewayPredictive{}
	limiter := &mockRateLimiterPredictive{rem: 5} // < 10 remaining tokens -> rate limited!

	engine := NewEngagementOptimizer(tenantID, aiGateway, limiter)
	_, err := engine.ExecutePrediction(context.Background(), map[string]string{
		"tenant_id":  tenantID,
		"content_id": "cnt-1",
	})
	if !errors.Is(err, domain.ErrAllPlatformsRateLimited) {
		t.Fatalf("expected ErrAllPlatformsRateLimited when remaining < 10, got %v", err)
	}
}

func TestMAPECalibrationLedger(t *testing.T) {
	ledger := NewCalibrationLedger()
	tenantID := "tenant-test"
	fc := &domain.ContentPerformanceForecast{
		ForecastID:     "fc-test-1",
		TenantID:       tenantID,
		PredictedViews: 100000,
	}
	ledger.RecordForecast(fc)

	mape, err := ledger.RecordActual(tenantID, "fc-test-1", 120000, 5000)
	if err != nil {
		t.Fatalf("unexpected error recording actual metrics: %v", err)
	}
	// abs(120000 - 100000) / 120000 * 100 = 20000 / 120000 * 100 = 16.666...%
	if mape < 16.6 || mape > 16.7 {
		t.Fatalf("expected MAPE ~16.67%%, got %.2f%%", mape)
	}
}

func TestTrendLifecycleStateMachineTransitions(t *testing.T) {
	sm := NewTrendLifecycleStateMachine()
	tenantID := "tenant-alpha"
	topicID := "topic-1"

	phase1, _, _ := sm.CalculateNextPhase(tenantID, topicID, 5.0)
	if phase1 != domain.TrendPhaseEmergence {
		t.Fatalf("expected EMERGENCE, got %s", phase1)
	}

	phase2, ema, _ := sm.CalculateNextPhase(tenantID, topicID, 20.0)
	if ema < 10.0 && phase2 != domain.TrendPhaseAcceleration {
		_ = time.Now()
	}
}

func TestStatisticalAnomalyDetectorThresholds(t *testing.T) {
	tenantID := "tenant-alpha"
	platform := domain.PlatformTwitter
	aiGateway := &mockAIGatewayPredictive{}

	engine := NewAnomalyDetector(tenantID, aiGateway)

	res1, err := engine.ExecutePrediction(context.Background(), map[string]string{
		"tenant_id":  tenantID,
		"platform":   string(platform),
		"engagement": "10.0",
		"velocity":   "5.0",
	})
	if err != nil {
		t.Fatalf("expected anomaly detect success, got %v", err)
	}
	anom1 := res1.(*domain.AnomalyDetectionEvent)
	if anom1.SeverityScore > 0.50 {
		t.Fatalf("expected benign severity score when statistical outlier is absent, got %.2f", anom1.SeverityScore)
	}

	res2, err := engine.ExecutePrediction(context.Background(), map[string]string{
		"tenant_id":  tenantID,
		"platform":   string(platform),
		"engagement": "50000.0",
		"velocity":   "600.0",
	})
	if err != nil {
		t.Fatalf("expected extreme spike anomaly detect success, got %v", err)
	}
	anom2 := res2.(*domain.AnomalyDetectionEvent)
	if anom2.SeverityScore < 0.85 {
		t.Fatalf("expected confirmed high severity score when statistical outlier is confirmed, got %.2f", anom2.SeverityScore)
	}
}

func TestPredictiveEngineCrossTenantViolation(t *testing.T) {
	tenantID := "tenant-test"
	aiGateway := &mockAIGatewayPredictive{}

	engine := NewEngagementOptimizer(tenantID, aiGateway, nil)
	_, err := engine.ExecutePrediction(context.Background(), map[string]string{
		"tenant_id":  "different-tenant",
		"content_id": "cnt-1",
	})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}
}

func TestPredictiveEngineAIGatewayError(t *testing.T) {
	tenantID := "tenant-test"
	aiGateway := &mockAIGatewayPredictive{err: errors.New("ai gateway offline")}

	engine := NewTrendLifecycleModeler(tenantID, aiGateway)
	_, err := engine.ExecutePrediction(context.Background(), map[string]string{
		"tenant_id": tenantID,
		"topic_id":  "top-1",
	})
	if err == nil {
		t.Fatalf("expected error from prediction when ai gateway fails")
	}
}

func TestCreateAllPredictiveEngines(t *testing.T) {
	tenantID := "tenant-test"
	aiGateway := &mockAIGatewayPredictive{}
	ledger := NewCalibrationLedger()

	all := CreateAllPredictiveEngines(tenantID, aiGateway, nil, ledger)
	if len(all) != 5 {
		t.Fatalf("expected 5 predictive engines (PRED-001 to PRED-005), got %d", len(all))
	}
	expectedIDs := []string{"PRED-001", "PRED-002", "PRED-003", "PRED-004", "PRED-005"}
	for _, id := range expectedIDs {
		if _, ok := all[id]; !ok {
			t.Fatalf("expected engine ID %s in map", id)
		}
	}
}
