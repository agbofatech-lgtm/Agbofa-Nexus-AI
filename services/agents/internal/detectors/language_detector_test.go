package detectors

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestLanguageDetector_InterfaceAndLocaleDetection(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewLanguageDetector(ai, bus)

	if detector.ID() != "AGT-014" {
		t.Errorf("expected ID AGT-014, got %s", detector.ID())
	}
	if detector.Name() != "Language/Locale Detector" {
		t.Errorf("expected Name Language/Locale Detector, got %s", detector.Name())
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
	err = detector.Initialize(ctx, "tenant-lang-1", map[string]string{"env": "test"})
	if err != nil {
		t.Fatalf("unexpected error initializing LanguageDetector: %v", err)
	}

	// 3. HealthCheck
	health, err := detector.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Detect English US
	sigEn := &domain.MonitorSignal{
		SignalID: "sig-en-1",
		TenantID: "tenant-lang-1",
		Content:  "Autonomous AI media platform delivering real-time news gathering",
	}
	resEn, err := detector.Detect(ctx, sigEn)
	if err != nil || resEn.Metadata["primary_language"] != "en" || resEn.Metadata["locale"] != "en-US" {
		t.Fatalf("expected en/en-US, got lang=%v loc=%v (err=%v)", resEn.Metadata["primary_language"], resEn.Metadata["locale"], err)
	}

	// 5. Detect English GB (British spelling)
	sigGb := &domain.MonitorSignal{
		SignalID: "sig-gb-1",
		TenantID: "tenant-lang-1",
		Content:  "The media centre announced new colour guidelines for its favour",
	}
	resGb, _ := detector.Detect(ctx, sigGb)
	if resGb.Metadata["locale"] != "en-GB" {
		t.Errorf("expected en-GB locale, got %s", resGb.Metadata["locale"])
	}

	// 6. Detect Spanish MX
	sigEs := &domain.MonitorSignal{
		SignalID: "sig-es-1",
		TenantID: "tenant-lang-1",
		Content:  "El sistema autónomo en los centros de noticias",
	}
	resEs, _ := detector.Detect(ctx, sigEs)
	if resEs.Metadata["primary_language"] != "es" || resEs.Metadata["locale"] != "es-MX" {
		t.Errorf("expected es/es-MX, got lang=%s loc=%s", resEs.Metadata["primary_language"], resEs.Metadata["locale"])
	}

	// 7. Detect Cyrillic script
	sigRu := &domain.MonitorSignal{
		SignalID: "sig-ru-1",
		TenantID: "tenant-lang-1",
		Content:  "Новая автономная система медиа",
	}
	resRu, _ := detector.Detect(ctx, sigRu)
	if resRu.Metadata["primary_language"] != "ru" || resRu.Metadata["script"] != "Cyrillic" {
		t.Errorf("expected ru/Cyrillic, got lang=%s script=%s", resRu.Metadata["primary_language"], resRu.Metadata["script"])
	}

	// 8. Very short text (<10 chars) degrades confidence gracefully
	sigShort := &domain.MonitorSignal{
		SignalID: "sig-short-1",
		TenantID: "tenant-lang-1",
		Content:  "hi",
	}
	resShort, _ := detector.Detect(ctx, sigShort)
	if resShort.ConfidenceScore > 0.65 {
		t.Errorf("expected degraded confidence for <10 chars, got %f", resShort.ConfidenceScore)
	}
}

func TestLanguageDetector_AnalyzeAndClassify(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewLanguageDetector(ai, bus)
	_ = detector.Initialize(ctx, "tenant-lang-1", nil)

	sig := &domain.MonitorSignal{
		SignalID: "sig-lang-analyse-1",
		TenantID: "tenant-lang-1",
		URL:      "https://example.com/article",
		Content:  "El sistema de inteligencia artificial and the global media operations",
	}

	// 1. Analyze routes through AIGatewayService and extracts multilingual secondary lang
	res, err := detector.Analyze(ctx, sig)
	if err != nil || res == nil {
		t.Fatalf("unexpected error on Analyze: %v", err)
	}
	if res.Metadata["ai_language_analysis"] != "AI Summarized Breaking Event" {
		t.Errorf("expected AI language analysis from gateway, got %s", res.Metadata["ai_language_analysis"])
	}
	if res.Metadata["iso_639_1"] == "" || res.Metadata["secondary_language"] != "en" {
		t.Errorf("expected iso_639_1 and secondary_language=en, got %v", res.Metadata)
	}

	// 2. Classify returns primary language code, confidence, script, and evidence items
	langCode, conf, evidence, err := detector.Classify(ctx, sig)
	if err != nil || len(evidence) == 0 {
		t.Fatalf("unexpected error on Classify: %v", err)
	}
	if langCode != "es" {
		t.Errorf("expected es classification, got %s", langCode)
	}
	if conf <= 0 || conf > 1.0 {
		t.Errorf("confidence score out of bounds: %f", conf)
	}
}
