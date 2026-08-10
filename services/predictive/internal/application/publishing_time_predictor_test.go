package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

func TestPublishingTimePredictorPredictAndOverrides(t *testing.T) {
	predictor := NewPublishingTimePredictionEngine(nil, nil, nil, nil)
	ctx := context.Background()

	// Empty tenant ID must fail
	if _, err := predictor.Predict(ctx, "", domain.PredictionTypePublishingTime, nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID, got %v", err)
	}

	// 1. Nominal prediction
	features := map[string]interface{}{
		"platform":         "TWITTER",
		"content_type":     "SOCIAL",
		"target_timezone":  "UTC",
		"platform_score":   0.90,
		"content_score":    0.80,
		"author_score":     0.70,
		"topic_score":      0.80,
		"competitor_score": 0.90,
	}

	res1, err := predictor.Predict(ctx, "tenant-XYZ", domain.PredictionTypePublishingTime, features)
	if err != nil {
		t.Fatalf("unexpected error on predict 1: %v", err)
	}
	if res1.Outputs["breaking_news_override"] != false {
		t.Fatalf("expected breaking_news_override = false")
	}
	if res1.Outputs["optimal_time_utc"] == "" {
		t.Fatalf("expected optimal_time_utc in outputs")
	}

	// 2. Breaking news override -> optimal_time = now
	featuresBreaking := map[string]interface{}{
		"platform": "TWITTER",
		"priority": "BREAKING",
	}
	resBreaking, err := predictor.Predict(ctx, "tenant-XYZ", domain.PredictionTypePublishingTime, featuresBreaking)
	if err != nil {
		t.Fatalf("unexpected error on predict breaking: %v", err)
	}
	if resBreaking.Outputs["breaking_news_override"] != true {
		t.Fatalf("expected breaking_news_override = true for breaking priority")
	}

	// 3. Embargo constraint -> NEVER schedules before embargo lift time
	embargoTime := time.Now().UTC().Add(48 * time.Hour)
	featuresEmbargo := map[string]interface{}{
		"platform":     "TWITTER",
		"embargo_time": embargoTime.Format(time.RFC3339),
	}
	resEmbargo, err := predictor.Predict(ctx, "tenant-XYZ", domain.PredictionTypePublishingTime, featuresEmbargo)
	if err != nil {
		t.Fatalf("unexpected error on predict embargo: %v", err)
	}
	if optStr, ok := resEmbargo.Outputs["optimal_time_utc"].(string); ok {
		if optTime, err := time.Parse(time.RFC3339, optStr); err == nil {
			if optTime.Before(embargoTime) {
				t.Fatalf("expected optimal time >= embargo time %s, got %s", embargoTime, optTime)
			}
		}
	}
}

func TestPublishingTimePredictorBatchPredictAndMetadata(t *testing.T) {
	predictor := NewPublishingTimePredictionEngine(nil, nil, nil, nil)
	ctx := context.Background()

	reqs := []*domain.PredictionRequest{
		{RequestID: "pub-1", TenantID: "tenant-1", PredictionType: domain.PredictionTypePublishingTime, Features: map[string]interface{}{"platform_score": 0.50}},
		{RequestID: "pub-2", TenantID: "tenant-1", PredictionType: domain.PredictionTypePublishingTime, Features: map[string]interface{}{"platform_score": 0.95}},
	}

	results, err := predictor.BatchPredict(ctx, "tenant-1", reqs)
	if err != nil || len(results) != 2 {
		t.Fatalf("expected 2 batch prediction results, got %d (err: %v)", len(results), err)
	}

	// Should be ranked by descending expected engagement score (pub-2 > pub-1)
	if results[0].RequestID != "pub-2" || results[1].RequestID != "pub-1" {
		t.Fatalf("expected batch results ranked by descending score")
	}

	meta, err := predictor.GetModelMetadata(ctx, "tenant-1", domain.PredictionTypePublishingTime)
	if err != nil {
		t.Fatalf("unexpected error on GetModelMetadata: %v", err)
	}
	if meta.Version != "pubtime-model-v2.1" || meta.AccuracyMetric != 0.89 {
		t.Fatalf("unexpected model metadata: %+v", meta)
	}
}
