package detectors

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestTrendIdentifier_InterfaceAndClustering(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewTrendIdentifier(ai, bus)

	if detector.ID() != "AGT-010" {
		t.Errorf("expected ID AGT-010, got %s", detector.ID())
	}
	if detector.Name() != "Trend Identifier" {
		t.Errorf("expected Name Trend Identifier, got %s", detector.Name())
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
	err = detector.Initialize(ctx, "tenant-trend-1", map[string]string{"env": "test"})
	if err != nil {
		t.Fatalf("unexpected error initializing TrendIdentifier: %v", err)
	}

	// 3. HealthCheck
	health, err := detector.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Detect with time-series clustering
	sig1 := &domain.MonitorSignal{
		SignalID: "sig-trend-1",
		TenantID: "tenant-trend-1",
		Author:   "user-1",
		Content:  "quantum computing advances announced",
		Platform: domain.PlatformTwitter,
	}
	res1, err := detector.Detect(ctx, sig1)
	if err != nil || res1.Metadata["cluster_signal_count"] != "1" {
		t.Fatalf("expected cluster count 1, got %v (err=%v)", res1.Metadata["cluster_signal_count"], err)
	}

	// Add more signals for same topic to test ACCELERATING / PEAK
	for i := 2; i <= 6; i++ {
		sig := &domain.MonitorSignal{
			SignalID: "sig-trend-" + string(rune('0'+i)),
			TenantID: "tenant-trend-1",
			Author:   "user-" + string(rune('0'+i)),
			Content:  "quantum computing breakthroughs",
			Platform: domain.PlatformLinkedIn,
		}
		_, _ = detector.Detect(ctx, sig)
	}

	sig7 := &domain.MonitorSignal{
		SignalID: "sig-trend-7",
		TenantID: "tenant-trend-1",
		Author:   "user-7",
		Content:  "quantum computing revolution",
		Platform: domain.PlatformYouTube,
	}
	res7, _ := detector.Detect(ctx, sig7)
	if res7.Metadata["cluster_signal_count"] != "7" {
		t.Errorf("expected cluster count 7, got %s", res7.Metadata["cluster_signal_count"])
	}

	if bus.detections < 7 {
		t.Errorf("expected at least 7 detection events published, got %d", bus.detections)
	}
}

func TestTrendIdentifier_AnalyzeAndClassify(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewTrendIdentifier(ai, bus)
	_ = detector.Initialize(ctx, "tenant-trend-1", nil)

	sig := &domain.MonitorSignal{
		SignalID: "sig-trend-analyse-1",
		TenantID: "tenant-trend-1",
		Author:   "analyst_beta",
		Content:  "Autonomous newsrooms scaling rapidly across global media",
		URL:      "https://x.com/analyst/1005",
		Platform: domain.PlatformTwitter,
	}

	// 1. Analyze routes through AIGatewayService and extracts metadata
	res, err := detector.Analyze(ctx, sig)
	if err != nil || res == nil {
		t.Fatalf("unexpected error on Analyze: %v", err)
	}
	if res.Metadata["ai_trend_narrative"] != "AI Summarized Breaking Event" {
		t.Errorf("expected AI trend narrative from gateway, got %s", res.Metadata["ai_trend_narrative"])
	}
	if res.Metadata["related_topics"] == "" || res.Metadata["geographic_spread"] == "" || res.Metadata["demographic_segments"] == "" {
		t.Errorf("expected related_topics/geographic_spread/demographic_segments extracted, got metadata=%v", res.Metadata)
	}

	// 2. Classify returns EMERGING/ACCELERATING/PEAK/EVERGREEN
	classification, momentum, evidence, err := detector.Classify(ctx, sig)
	if err != nil || len(evidence) == 0 {
		t.Fatalf("unexpected error on Classify: %v", err)
	}
	if classification != "EMERGING" && classification != "ACCELERATING" && classification != "PEAK" && classification != "EVERGREEN" {
		t.Errorf("unexpected classification: %s", classification)
	}
	if momentum <= 0 || momentum > 1.0 {
		t.Errorf("momentum score out of bounds: %f", momentum)
	}

	// Test evergreen classification
	evergreenSig := &domain.MonitorSignal{
		SignalID: "sig-evergreen-1",
		TenantID: "tenant-trend-1",
		Author:   "analyst_beta",
		Content:  "Evergreen media guide to AI platform architecture",
		Platform: domain.PlatformTwitter,
	}
	evClass, _, _, _ := detector.Classify(ctx, evergreenSig)
	if evClass != "EVERGREEN" {
		t.Errorf("expected EVERGREEN classification, got %s", evClass)
	}
}
