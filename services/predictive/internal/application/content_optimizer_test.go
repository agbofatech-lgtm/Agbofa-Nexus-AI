package application

import (
	"context"
	"errors"
	"math"
	"testing"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

func TestContentOptimizerPredictNormal(t *testing.T) {
	optimizer := NewContentPerformanceOptimizer(nil, nil, nil, nil)
	ctx := context.Background()

	// Empty tenant ID must fail
	if _, err := optimizer.Predict(ctx, "", domain.PredictionTypeContentOptimization, nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID, got %v", err)
	}

	features := map[string]interface{}{
		"headline_score": 0.50, // lift = 0.50
		"media_score":    0.60, // lift = 0.40
		"keyword_score":  0.50, // lift = 0.50
		"length_score":   0.80, // lift = 0.20
	}

	res, err := optimizer.Predict(ctx, "tenant-XYZ", domain.PredictionTypeContentOptimization, features)
	if err != nil {
		t.Fatalf("unexpected error on predict: %v", err)
	}

	// rawLift = 0.35*(1-0.5) + 0.30*(1-0.6) + 0.20*(1-0.5) + 0.15*(1-0.8) = 0.35*0.5 + 0.30*0.4 + 0.20*0.5 + 0.15*0.2 = 0.175 + 0.12 + 0.10 + 0.03 = 0.425
	expectedLift := 0.425
	if math.Abs(res.Score-expectedLift) > 0.001 {
		t.Fatalf("expected expected_lift %.4f, got %.4f", expectedLift, res.Score)
	}

	if res.Outputs["content_modified"] != false {
		t.Fatalf("expected content_modified = false (never modify content)")
	}
	if res.Metadata["content_modification_prohibited"] != "true" {
		t.Fatalf("missing mandatory content modification prohibited flag")
	}

	suggs, ok := res.Outputs["optimization_suggestions"].([]string)
	if !ok || len(suggs) != 4 {
		t.Fatalf("expected 4 ordered optimization suggestions, got %d", len(suggs))
	}
}

func TestContentOptimizerBatchPredictRanking(t *testing.T) {
	optimizer := NewContentPerformanceOptimizer(nil, nil, nil, nil)
	ctx := context.Background()

	reqs := []*domain.PredictionRequest{
		{RequestID: "var-1", TenantID: "tenant-1", PredictionType: domain.PredictionTypeContentOptimization, Features: map[string]interface{}{"headline_score": 0.90}}, // small lift
		{RequestID: "var-2", TenantID: "tenant-1", PredictionType: domain.PredictionTypeContentOptimization, Features: map[string]interface{}{"headline_score": 0.20}}, // high lift
	}

	results, err := optimizer.BatchPredict(ctx, "tenant-1", reqs)
	if err != nil || len(results) != 2 {
		t.Fatalf("expected 2 batch prediction results, got %d (err: %v)", len(results), err)
	}

	// Verify ranked by predicted performance (highest expected lift first: var-2 > var-1)
	if results[0].RequestID != "var-2" || results[1].RequestID != "var-1" {
		t.Fatalf("expected batch results ranked by descending score (var-2 then var-1)")
	}
}

func TestContentOptimizerMetadataAndTenantIsolation(t *testing.T) {
	optimizer := NewContentPerformanceOptimizer(nil, nil, nil, nil)
	ctx := context.Background()

	meta, err := optimizer.GetModelMetadata(ctx, "tenant-1", domain.PredictionTypeContentOptimization)
	if err != nil {
		t.Fatalf("unexpected error on GetModelMetadata: %v", err)
	}
	if meta.Version != "optimizer-model-v2.1" || meta.AccuracyMetric != 0.86 {
		t.Fatalf("unexpected model metadata: %+v", meta)
	}
}
