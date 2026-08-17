package domain

import (
	"testing"
	"time"
)

func TestPredictiveStructures(t *testing.T) {
	virality := &ViralityPrediction{
		PredictionID:       "pred-1",
		TenantID:           "tenant-test",
		StoryID:            "story-1",
		ViralityScore:      0.95,
		ConfidenceInterval: 0.05,
		PredictedAt:        time.Now(),
	}
	if virality.ViralityScore != 0.95 || virality.StoryID != "story-1" {
		t.Fatalf("unexpected virality prediction properties")
	}

	opt := &EngagementOptimization{
		OptimizationID: "opt-1",
		TenantID:       "tenant-test",
		ContentID:      "cnt-1",
		OptimalTimes:   []string{"08:00 UTC"},
	}
	if len(opt.OptimalTimes) != 1 || opt.OptimalTimes[0] != "08:00 UTC" {
		t.Fatalf("unexpected engagement optimization properties")
	}

	model := &TrendLifecycleModel{
		ModelID:      "mod-1",
		TenantID:     "tenant-test",
		TopicID:      "top-1",
		CurrentPhase: TrendPhaseAcceleration,
		Velocity:     55.0,
	}
	if model.CurrentPhase != TrendPhaseAcceleration || model.Velocity != 55.0 {
		t.Fatalf("unexpected trend lifecycle model properties")
	}

	forecast := &ContentPerformanceForecast{
		ForecastID:       "fc-1",
		TenantID:         "tenant-test",
		ContentID:        "cnt-1",
		PredictedViews:   500000,
		EngagementRate:   0.08,
		ConfidenceMetric: 0.92,
	}
	if forecast.PredictedViews != 500000 || forecast.EngagementRate != 0.08 {
		t.Fatalf("unexpected performance forecast properties")
	}

	anomaly := &AnomalyDetectionEvent{
		AnomalyID:     "anom-1",
		TenantID:      "tenant-test",
		Platform:      PlatformTwitter,
		AnomalyType:   "COORDINATED_INAUTHENTIC_BEHAVIOR",
		SeverityScore: 0.85,
	}
	if anomaly.Platform != PlatformTwitter || anomaly.SeverityScore != 0.85 {
		t.Fatalf("unexpected anomaly detection event properties")
	}
}

func TestEventTypePredictiveIntelligenceGeneratedConstant(t *testing.T) {
	if EventTypePredictiveIntelligenceGenerated != "EVT-038" {
		t.Fatalf("expected EVT-038, got %s", EventTypePredictiveIntelligenceGenerated)
	}
}
