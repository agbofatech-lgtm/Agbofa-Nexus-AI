package application

import (
	"context"
	"errors"
	"math"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

type mockViralityFallback struct {
	called bool
	res    *domain.ViralityPrediction
	err    error
}

func (m *mockViralityFallback) PredictHeuristic(ctx context.Context, tenantID string, features domain.ViralityFeatures) (*domain.ViralityPrediction, error) {
	m.called = true
	if m.err != nil {
		return nil, m.err
	}
	if m.res != nil {
		return m.res, nil
	}
	return &domain.ViralityPrediction{
		PredictionID:    "pred-fallback-001",
		TenantID:        tenantID,
		ContentID:       "cnt-100",
		ViralityScore:   0.65,
		Confidence:      0.60,
		PeakTimeHorizon: 4 * time.Hour,
		EstimatedReach:  100000,
		PredictedAt:     time.Now(),
	}, nil
}

func TestViralityEnginePredictModelScore(t *testing.T) {
	engine := NewViralityPredictionEngine(nil, nil, nil, nil, nil, nil)
	ctx := context.Background()

	// Empty tenant ID must fail
	if _, err := engine.Predict(ctx, "", domain.PredictionTypeVirality, nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID, got %v", err)
	}

	// Invalid prediction type must fail
	if _, err := engine.Predict(ctx, "tenant-A", domain.PredictionTypeEngagement, nil); !errors.Is(err, domain.ErrInvalidPredictionType) {
		t.Fatalf("expected ErrInvalidPredictionType, got %v", err)
	}

	features := map[string]interface{}{
		"velocity_per_hour":    80.0,  // norm = 0.80
		"engagement_velocity":  0.90,  // norm = 0.90
		"sentiment_intensity":  -0.70, // abs norm = 0.70
		"source_authority":     0.85,  // norm = 0.85
		"cross_platform_share": 8,     // norm = 0.80
		"data_volume":          200.0, // confidence = 0.88 >= 0.70 threshold
	}

	res, err := engine.Predict(ctx, "tenant-A", domain.PredictionTypeVirality, features)
	if err != nil {
		t.Fatalf("unexpected error on model predict: %v", err)
	}

	// 0.30*0.80 + 0.25*0.90 + 0.20*0.70 + 0.15*0.85 + 0.10*0.80 = 0.24 + 0.225 + 0.14 + 0.1275 + 0.08 = 0.8125
	expectedScore := 0.8125
	if math.Abs(res.Score-expectedScore) > 0.001 {
		t.Fatalf("expected score %.4f, got %.4f", expectedScore, res.Score)
	}
	if res.Outputs["virality_tier"] != "VIRAL" { // 0.8125 > 0.80 -> VIRAL
		t.Fatalf("expected VIRAL tier, got %v", res.Outputs["virality_tier"])
	}
	if res.Outputs["fallback_delegated"] != false {
		t.Fatalf("expected fallback_delegated = false")
	}
	if res.ModelVersion != "virality-model-v2.1" {
		t.Fatalf("expected active model version virality-model-v2.1, got %s", res.ModelVersion)
	}
}

func TestViralityEnginePredictFallbackToAGT016(t *testing.T) {
	mockFB := &mockViralityFallback{}
	engine := NewViralityPredictionEngine(nil, nil, nil, nil, nil, mockFB)
	ctx := context.Background()

	// Low data volume (< 50) triggers confidence = 0.55 < 0.70 authoritative fallback threshold
	features := map[string]interface{}{
		"velocity_per_hour": 20.0,
		"data_volume":       10.0,
	}

	res, err := engine.Predict(ctx, "tenant-XYZ", domain.PredictionTypeVirality, features)
	if err != nil {
		t.Fatalf("unexpected error on fallback predict: %v", err)
	}

	if !mockFB.called {
		t.Fatalf("expected AGT-016 fallback agent to be called when confidence < 0.70 threshold")
	}
	if res.ModelVersion != "AGT-016-heuristic-fallback" {
		t.Fatalf("expected AGT-016-heuristic-fallback version, got %s", res.ModelVersion)
	}
	if res.Outputs["fallback_delegated"] != true {
		t.Fatalf("expected fallback_delegated = true")
	}
	if res.Score != 0.65 { // from mockFB
		t.Fatalf("expected score 0.65 from heuristic fallback, got %.2f", res.Score)
	}
}

func TestViralityEngineBatchPredictAndMetadata(t *testing.T) {
	engine := NewViralityPredictionEngine(nil, nil, nil, nil, nil, nil)
	ctx := context.Background()

	reqs := []*domain.PredictionRequest{
		{RequestID: "req-1", TenantID: "tenant-1", PredictionType: domain.PredictionTypeVirality, Features: map[string]interface{}{"velocity_per_hour": 90.0}},
		{RequestID: "req-2", TenantID: "tenant-1", PredictionType: domain.PredictionTypeVirality, Features: map[string]interface{}{"velocity_per_hour": 40.0}},
	}

	results, err := engine.BatchPredict(ctx, "tenant-1", reqs)
	if err != nil || len(results) != 2 {
		t.Fatalf("expected 2 batch prediction results, got %d (err: %v)", len(results), err)
	}
	if results[0].RequestID != "req-1" || results[1].RequestID != "req-2" {
		t.Fatalf("expected batch results in request order")
	}

	meta, err := engine.GetModelMetadata(ctx, "tenant-1", domain.PredictionTypeVirality)
	if err != nil {
		t.Fatalf("unexpected error on GetModelMetadata: %v", err)
	}
	if meta.Version != "virality-model-v2.1" || meta.AccuracyMetric != 0.89 {
		t.Fatalf("unexpected model metadata: %+v", meta)
	}
}
