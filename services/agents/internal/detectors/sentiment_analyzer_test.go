package detectors

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestSentimentAnalyzer_InterfaceAndPolarity(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewSentimentAnalyzer(ai, bus)

	if detector.ID() != "AGT-011" {
		t.Errorf("expected ID AGT-011, got %s", detector.ID())
	}
	if detector.Name() != "Sentiment Analyzer" {
		t.Errorf("expected Name Sentiment Analyzer, got %s", detector.Name())
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
	err = detector.Initialize(ctx, "tenant-sent-1", map[string]string{"env": "test"})
	if err != nil {
		t.Fatalf("unexpected error initializing SentimentAnalyzer: %v", err)
	}

	// 3. HealthCheck
	health, err := detector.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Detect POSITIVE sentiment
	sigPos := &domain.MonitorSignal{
		SignalID: "sig-pos-1",
		TenantID: "tenant-sent-1",
		Author:   "user-pos",
		Content:  "Major record breakthrough success reported in renewable energy!",
		Platform: domain.PlatformTwitter,
	}
	resPos, err := detector.Detect(ctx, sigPos)
	if err != nil || resPos.Metadata["sentiment_label"] != "POSITIVE" {
		t.Fatalf("expected POSITIVE label, got %v (err=%v)", resPos.Metadata["sentiment_label"], err)
	}

	// 5. Detect NEGATIVE sentiment
	sigNeg := &domain.MonitorSignal{
		SignalID: "sig-neg-1",
		TenantID: "tenant-sent-1",
		Author:   "user-neg",
		Content:  "Catastrophic failure and crisis causes economic loss",
		Platform: domain.PlatformFacebook,
	}
	resNeg, _ := detector.Detect(ctx, sigNeg)
	if resNeg.Metadata["sentiment_label"] != "NEGATIVE" {
		t.Errorf("expected NEGATIVE label, got %s", resNeg.Metadata["sentiment_label"])
	}

	// 6. Detect MIXED sentiment
	sigMix := &domain.MonitorSignal{
		SignalID: "sig-mix-1",
		TenantID: "tenant-sent-1",
		Author:   "user-mix",
		Content:  "Despite initial record growth and triumph, project suffered massive failure later",
		Platform: domain.PlatformLinkedIn,
	}
	resMix, _ := detector.Detect(ctx, sigMix)
	if resMix.Metadata["sentiment_label"] != "MIXED" {
		t.Errorf("expected MIXED label, got %s", resMix.Metadata["sentiment_label"])
	}
}

func TestSentimentAnalyzer_AnalyzeAndClassify(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewSentimentAnalyzer(ai, bus)
	_ = detector.Initialize(ctx, "tenant-sent-1", nil)

	sig := &domain.MonitorSignal{
		SignalID: "sig-sent-analyse-1",
		TenantID: "tenant-sent-1",
		Author:   "reporter_gamma",
		Content:  "Yeah right sure buddy, great positive success on that disaster project",
		URL:      "https://x.com/reporter/1009",
		Platform: domain.PlatformTwitter,
	}

	// 1. Analyze routes through AIGatewayService and extracts sarcasm / intensity
	res, err := detector.Analyze(ctx, sig)
	if err != nil || res == nil {
		t.Fatalf("unexpected error on Analyze: %v", err)
	}
	if res.Metadata["ai_sentiment_summary"] != "AI Summarized Breaking Event" {
		t.Errorf("expected AI summary from gateway, got %s", res.Metadata["ai_sentiment_summary"])
	}
	if res.Metadata["sarcasm_flag"] != "true" {
		t.Errorf("expected sarcasm_flag=true, got %s", res.Metadata["sarcasm_flag"])
	}

	// 2. Classify returns sentiment label, confidence, and evidence items
	classification, conf, evidence, err := detector.Classify(ctx, sig)
	if err != nil || len(evidence) == 0 {
		t.Fatalf("unexpected error on Classify: %v", err)
	}
	if classification != "POSITIVE" && classification != "NEGATIVE" && classification != "NEUTRAL" && classification != "MIXED" {
		t.Errorf("unexpected sentiment classification: %s", classification)
	}
	if conf <= 0 || conf > 1.0 {
		t.Errorf("confidence score out of bounds: %f", conf)
	}
}
