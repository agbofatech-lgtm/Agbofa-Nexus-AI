package application

import (
	"context"
	"errors"
	"math"
	"testing"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

func TestTrendLifecyclePredictorPredictPhases(t *testing.T) {
	predictor := NewTrendLifecyclePredictionEngine(nil, nil, nil, nil)
	ctx := context.Background()

	// Empty tenant ID must fail
	if _, err := predictor.Predict(ctx, "", domain.PredictionTypeTrendLifecycle, nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID, got %v", err)
	}

	testCases := []struct {
		currentPhase string
		growthRate   float64
		wantNext     string
		wantTimeTo   float64
	}{
		{"EMERGING", 0.8, "ACCELERATING", 12.0},
		{"ACCELERATING", 1.8, "PEAK", 4.0},
		{"PEAK", 0.1, "DECAY", 0.0},
		{"DECAY", -0.2, "EVERGREEN", 0.0},
	}

	for _, tc := range testCases {
		features := map[string]interface{}{
			"current_phase":     tc.currentPhase,
			"growth_rate":       tc.growthRate,
			"mention_count":     5000.0,
			"platform_spread":   6,
			"entity_saturation": 0.50,
		}

		res, err := predictor.Predict(ctx, "tenant-XYZ", domain.PredictionTypeTrendLifecycle, features)
		if err != nil {
			t.Fatalf("unexpected error on predict phase %s: %v", tc.currentPhase, err)
		}

		if res.Outputs["current_phase"] != tc.currentPhase {
			t.Fatalf("expected current phase %s, got %v", tc.currentPhase, res.Outputs["current_phase"])
		}
		if res.Outputs["predicted_next_phase"] != tc.wantNext {
			t.Fatalf("expected next phase %s, got %v", tc.wantNext, res.Outputs["predicted_next_phase"])
		}
		if res.Outputs["time_to_peak_hours"] != tc.wantTimeTo {
			t.Fatalf("expected time to peak %.1f, got %v", tc.wantTimeTo, res.Outputs["time_to_peak_hours"])
		}
		if res.Outputs["pattern_library_matches"] != 500 {
			t.Fatalf("expected pattern_library_matches = 500, got %v", res.Outputs["pattern_library_matches"])
		}

		// Verify score is clamped to [0.0, 1.0]
		if res.Score < 0.0 || res.Score > 1.0 {
			t.Fatalf("expected lifecycle confidence score clamped to [0.0, 1.0], got %.4f", res.Score)
		}
		if math.Abs(res.Confidence-0.91) > 0.001 {
			t.Fatalf("expected pattern match confidence 0.91, got %.2f", res.Confidence)
		}
	}
}

func TestTrendLifecyclePredictorBatchPredictAndMetadata(t *testing.T) {
	predictor := NewTrendLifecyclePredictionEngine(nil, nil, nil, nil)
	ctx := context.Background()

	reqs := []*domain.PredictionRequest{
		{RequestID: "tr-1", TenantID: "tenant-1", PredictionType: domain.PredictionTypeTrendLifecycle, Features: map[string]interface{}{"current_phase": "EMERGING"}},
		{RequestID: "tr-2", TenantID: "tenant-1", PredictionType: domain.PredictionTypeTrendLifecycle, Features: map[string]interface{}{"current_phase": "PEAK"}},
	}

	results, err := predictor.BatchPredict(ctx, "tenant-1", reqs)
	if err != nil || len(results) != 2 {
		t.Fatalf("expected 2 batch prediction results, got %d (err: %v)", len(results), err)
	}
	if results[0].RequestID != "tr-1" || results[1].RequestID != "tr-2" {
		t.Fatalf("expected batch results in request order")
	}

	meta, err := predictor.GetModelMetadata(ctx, "tenant-1", domain.PredictionTypeTrendLifecycle)
	if err != nil {
		t.Fatalf("unexpected error on GetModelMetadata: %v", err)
	}
	if meta.Version != "lifecycle-model-v2.1" || meta.AccuracyMetric != 0.88 {
		t.Fatalf("unexpected model metadata: %+v", meta)
	}
}
