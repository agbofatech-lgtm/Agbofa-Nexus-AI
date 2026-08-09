package application

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

func TestAnomalyDetectorPredictTypesAndSuppression(t *testing.T) {
	detector := NewAnomalyDetectionEngine(nil, nil, nil, nil)
	ctx := context.Background()

	// Empty tenant ID must fail
	if _, err := detector.Predict(ctx, "", domain.PredictionTypeAnomaly, nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID, got %v", err)
	}

	// 1. First SPIKE observation (>3 sigma) -> is_anomaly = false (requires 2+ consecutive)
	features1 := map[string]interface{}{
		"stream_id":       "stream-A",
		"baseline_value":  100.0,
		"current_value":   200.0, // sigma = 100 / 15 = 6.67 > 3.0 -> SPIKE
		"deviation_sigma": 6.67,
	}

	res1, err := detector.Predict(ctx, "tenant-XYZ", domain.PredictionTypeAnomaly, features1)
	if err != nil {
		t.Fatalf("unexpected error on predict 1: %v", err)
	}
	if res1.Outputs["anomaly_type"] != string(domain.AnomalyTypeSpike) {
		t.Fatalf("expected SPIKE, got %v", res1.Outputs["anomaly_type"])
	}
	if res1.Outputs["consecutive_count"] != 1 || res1.Outputs["is_anomaly"] != false {
		t.Fatalf("expected consecutive_count=1 and is_anomaly=false on first observation (false positive suppression)")
	}

	// 2. Second consecutive SPIKE observation -> is_anomaly = true
	res2, err := detector.Predict(ctx, "tenant-XYZ", domain.PredictionTypeAnomaly, features1)
	if err != nil {
		t.Fatalf("unexpected error on predict 2: %v", err)
	}
	if res2.Outputs["consecutive_count"] != 2 || res2.Outputs["is_anomaly"] != true {
		t.Fatalf("expected consecutive_count=2 and is_anomaly=true on second observation")
	}
	if res2.Outputs["agt_009_early_warning"] != true { // 6.67 > 4.0 -> early warning
		t.Fatalf("expected agt_009_early_warning=true")
	}

	// 3. EMERGENCE observation (baseline_value = 0)
	featuresEmerg := map[string]interface{}{
		"stream_id":      "stream-B",
		"baseline_value": 0.0,
		"current_value":  50.0,
	}
	_ = detector.Predict(ctx, "tenant-XYZ", domain.PredictionTypeAnomaly, featuresEmerg)
	resEmerg, _ := detector.Predict(ctx, "tenant-XYZ", domain.PredictionTypeAnomaly, featuresEmerg)
	if resEmerg.Outputs["anomaly_type"] != string(domain.AnomalyTypeEmergence) || resEmerg.Outputs["is_anomaly"] != true {
		t.Fatalf("expected EMERGENCE and is_anomaly=true on second emergence observation")
	}
}

func TestAnomalyDetectorBatchPredictAndMetadata(t *testing.T) {
	detector := NewAnomalyDetectionEngine(nil, nil, nil, nil)
	ctx := context.Background()

	reqs := []*domain.PredictionRequest{
		{RequestID: "anom-1", TenantID: "tenant-1", PredictionType: domain.PredictionTypeAnomaly, Features: map[string]interface{}{"stream_id": "s1", "deviation_sigma": 1.0}},
		{RequestID: "anom-2", TenantID: "tenant-1", PredictionType: domain.PredictionTypeAnomaly, Features: map[string]interface{}{"stream_id": "s2", "deviation_sigma": -4.0}},
	}

	results, err := detector.BatchPredict(ctx, "tenant-1", reqs)
	if err != nil || len(results) != 2 {
		t.Fatalf("expected 2 batch prediction results, got %d (err: %v)", len(results), err)
	}
	if results[0].RequestID != "anom-1" || results[1].RequestID != "anom-2" {
		t.Fatalf("expected batch results in request order")
	}

	meta, err := detector.GetModelMetadata(ctx, "tenant-1", domain.PredictionTypeAnomaly)
	if err != nil {
		t.Fatalf("unexpected error on GetModelMetadata: %v", err)
	}
	if meta.Version != "anomaly-model-v2.1" || meta.AccuracyMetric != 0.91 {
		t.Fatalf("unexpected model metadata: %+v", meta)
	}
}
