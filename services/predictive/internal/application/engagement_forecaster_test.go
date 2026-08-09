package application

import (
	"context"
	"errors"
	"math"
	"testing"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

func TestEngagementForecasterPredictNormal(t *testing.T) {
	forecaster := NewAudienceEngagementForecaster(nil, nil, nil, nil)
	ctx := context.Background()

	// Empty tenant ID must fail
	if _, err := forecaster.Predict(ctx, "", domain.PredictionTypeEngagement, nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID, got %v", err)
	}

	features := map[string]interface{}{
		"author_performance": 0.90, // histAuth = 0.90
		"topic_score":        0.80, // topic = 0.80
		"content_type":       "VIDEO", // contentBaseline = 0.85
		"audience_score":     0.80, // aud = 0.80
		"time_of_day_score":  0.80, // time = 0.80
	}

	res, err := forecaster.Predict(ctx, "tenant-XYZ", domain.PredictionTypeEngagement, features)
	if err != nil {
		t.Fatalf("unexpected error on predict: %v", err)
	}

	// 0.30*0.90 + 0.25*0.80 + 0.20*0.85 + 0.15*0.80 + 0.10*0.80 = 0.27 + 0.20 + 0.17 + 0.12 + 0.08 = 0.84
	expectedRate := 0.84
	if math.Abs(res.Score-expectedRate) > 0.001 {
		t.Fatalf("expected rate %.4f, got %.4f", expectedRate, res.Score)
	}
	if res.Outputs["cold_start_fallback"] != false {
		t.Fatalf("expected cold_start_fallback = false")
	}
	if res.Outputs["engagement_tier"] != "HIGH" { // 0.84 > 0.75 -> HIGH
		t.Fatalf("expected HIGH tier, got %v", res.Outputs["engagement_tier"])
	}
	if res.Confidence != 0.90 {
		t.Fatalf("expected 0.90 confidence with historical author data, got %.2f", res.Confidence)
	}
}

func TestEngagementForecasterPredictColdStart(t *testing.T) {
	forecaster := NewAudienceEngagementForecaster(nil, nil, nil, nil)
	ctx := context.Background()

	// Missing author_performance triggers cold-start fallback (author_performance = 0.50 baseline)
	features := map[string]interface{}{
		"content_type": "SOCIAL",
	}

	res, err := forecaster.Predict(ctx, "tenant-XYZ", domain.PredictionTypeEngagement, features)
	if err != nil {
		t.Fatalf("unexpected error on cold-start predict: %v", err)
	}

	if res.Outputs["cold_start_fallback"] != true {
		t.Fatalf("expected cold_start_fallback = true")
	}
	if res.Confidence != 0.65 {
		t.Fatalf("expected reduced confidence 0.65 on cold start, got %.2f", res.Confidence)
	}
}

func TestEngagementForecasterBatchPredictAndMetadata(t *testing.T) {
	forecaster := NewAudienceEngagementForecaster(nil, nil, nil, nil)
	ctx := context.Background()

	reqs := []*domain.PredictionRequest{
		{RequestID: "eng-1", TenantID: "tenant-1", PredictionType: domain.PredictionTypeEngagement, Features: map[string]interface{}{"author_performance": 0.80}},
		{RequestID: "eng-2", TenantID: "tenant-1", PredictionType: domain.PredictionTypeEngagement, Features: map[string]interface{}{"author_performance": 0.40}},
	}

	results, err := forecaster.BatchPredict(ctx, "tenant-1", reqs)
	if err != nil || len(results) != 2 {
		t.Fatalf("expected 2 batch prediction results, got %d (err: %v)", len(results), err)
	}
	if results[0].RequestID != "eng-1" || results[1].RequestID != "eng-2" {
		t.Fatalf("expected batch results in request order")
	}

	meta, err := forecaster.GetModelMetadata(ctx, "tenant-1", domain.PredictionTypeEngagement)
	if err != nil {
		t.Fatalf("unexpected error on GetModelMetadata: %v", err)
	}
	if meta.Version != "engagement-model-v2.1" || meta.AccuracyMetric != 0.87 {
		t.Fatalf("unexpected model metadata: %+v", meta)
	}
}
