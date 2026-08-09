package detectors

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestViralityPredictor_InterfaceAndTiers(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewViralityPredictor(ai, bus)

	if detector.ID() != "AGT-016" {
		t.Errorf("expected ID AGT-016, got %s", detector.ID())
	}
	if detector.Name() != "Virality Predictor" {
		t.Errorf("expected Name Virality Predictor, got %s", detector.Name())
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
	err = detector.Initialize(ctx, "tenant-viral-1", map[string]string{"env": "test"})
	if err != nil {
		t.Fatalf("unexpected error initializing ViralityPredictor: %v", err)
	}

	// 3. HealthCheck
	health, err := detector.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Detect NORMAL tier
	sigNormal := &domain.MonitorSignal{
		SignalID: "sig-normal-1",
		TenantID: "tenant-viral-1",
		Author:   "user_norm",
		Content:  "Routine daily newsletter update on tech trends",
		Metadata: map[string]string{
			"velocity_shares_per_hour": "50",
			"reach_unique_viewers":     "1000",
			"amplification_rate":       "0.10",
			"cross_platform_count":     "1",
		},
	}
	resNormal, err := detector.Detect(ctx, sigNormal)
	if err != nil || resNormal.Metadata["virality_tier"] != "NORMAL" {
		t.Fatalf("expected NORMAL tier, got %v (err=%v)", resNormal.Metadata["virality_tier"], err)
	}

	// 5. Detect HIGH_POTENTIAL tier
	sigHigh := &domain.MonitorSignal{
		SignalID: "sig-high-1",
		TenantID: "tenant-viral-1",
		Author:   "user_high",
		Content:  "Notable announcement gains traction across social feeds",
		Metadata: map[string]string{
			"velocity_shares_per_hour": "250",
			"reach_unique_viewers":     "10000",
			"amplification_rate":       "0.35",
			"cross_platform_count":     "3",
		},
	}
	resHigh, _ := detector.Detect(ctx, sigHigh)
	if resHigh.Metadata["virality_tier"] != "HIGH_POTENTIAL" {
		t.Errorf("expected HIGH_POTENTIAL tier, got %s", resHigh.Metadata["virality_tier"])
	}

	// 6. Detect VIRAL tier
	sigViral := &domain.MonitorSignal{
		SignalID: "sig-viral-1",
		TenantID: "tenant-viral-1",
		Author:   "user_viral",
		Content:  "Explosive viral breaking announcement spreading rapidly everywhere",
		Metadata: map[string]string{
			"velocity_shares_per_hour": "600",
			"reach_unique_viewers":     "100000",
			"amplification_rate":       "0.60",
			"cross_platform_count":     "6",
		},
	}
	resViral, _ := detector.Detect(ctx, sigViral)
	if resViral.Metadata["virality_tier"] != "VIRAL" {
		t.Errorf("expected VIRAL tier, got %s", resViral.Metadata["virality_tier"])
	}

	// 7. Test confidence scaling with data volume
	if resNormal.ConfidenceScore > 0.70 {
		t.Errorf("expected low initial confidence <0.70 on first signal, got %f", resNormal.ConfidenceScore)
	}
	for i := 0; i < 10; i++ {
		_, _ = detector.Detect(ctx, sigViral)
	}
	tier, conf, evidence, _ := detector.Classify(ctx, sigViral)
	if tier != "VIRAL" || conf < 0.90 || len(evidence) == 0 {
		t.Errorf("expected VIRAL tier with scaled confidence >= 0.90 after 10 signals, got tier=%s conf=%f", tier, conf)
	}
}

func TestViralityPredictor_AnalyzeAndClassify(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewViralityPredictor(ai, bus)
	_ = detector.Initialize(ctx, "tenant-viral-1", nil)

	sig := &domain.MonitorSignal{
		SignalID: "sig-viral-analyse-1",
		TenantID: "tenant-viral-1",
		Author:   "reporter_delta",
		Content:  "Massive social engagement surge around AI media platform release",
		URL:      "https://x.com/reporter/1015",
	}

	// 1. Analyze routes through AIGatewayService and attaches weighted factors
	res, err := detector.Analyze(ctx, sig)
	if err != nil || res == nil {
		t.Fatalf("unexpected error on Analyze: %v", err)
	}
	if res.Metadata["ai_virality_assessment"] != "AI Summarized Breaking Event" {
		t.Errorf("expected AI assessment from gateway, got %s", res.Metadata["ai_virality_assessment"])
	}
	if res.Metadata["weighted_factors"] == "" {
		t.Errorf("expected weighted_factors metadata set")
	}

	// 2. Classify returns virality tier, confidence, and evidence items
	tier, conf, evidence, err := detector.Classify(ctx, sig)
	if err != nil || len(evidence) == 0 {
		t.Fatalf("unexpected error on Classify: %v", err)
	}
	if tier != "NORMAL" && tier != "HIGH_POTENTIAL" && tier != "VIRAL" {
		t.Errorf("unexpected virality tier: %s", tier)
	}
	if conf <= 0 || conf > 1.0 {
		t.Errorf("confidence score out of bounds: %f", conf)
	}
}
