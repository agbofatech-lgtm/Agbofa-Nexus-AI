package detectors

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestDuplicateChecker_InterfaceAndHashMatching(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewDuplicateChecker(ai, bus)

	if detector.ID() != "AGT-015" {
		t.Errorf("expected ID AGT-015, got %s", detector.ID())
	}
	if detector.Name() != "Duplicate/Plagiarism Checker" {
		t.Errorf("expected Name Duplicate/Plagiarism Checker, got %s", detector.Name())
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
	err = detector.Initialize(ctx, "tenant-dup-1", map[string]string{"env": "test"})
	if err != nil {
		t.Fatalf("unexpected error initializing DuplicateChecker: %v", err)
	}

	// 3. HealthCheck
	health, err := detector.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Detect ORIGINAL signal
	sig1 := &domain.MonitorSignal{
		SignalID: "sig-orig-1",
		TenantID: "tenant-dup-1",
		Author:   "author_reuters",
		Content:  "Autonomous AI media platform deploys 32 specialized agents across global newsrooms",
		Platform: domain.PlatformTwitter,
		Language: "en-US",
	}
	res1, err := detector.Detect(ctx, sig1)
	if err != nil || res1.Metadata["content_status"] != "ORIGINAL" {
		t.Fatalf("expected ORIGINAL content status, got %v (err=%v)", res1.Metadata["content_status"], err)
	}

	// 5. Detect exact DUPLICATE signal (identical text)
	sig2 := &domain.MonitorSignal{
		SignalID: "sig-dup-2",
		TenantID: "tenant-dup-1",
		Author:   "author_copycat",
		Content:  "  Autonomous AI media platform deploys 32 specialized agents across global newsrooms  ",
		Platform: domain.PlatformFacebook,
		Language: "en-US",
	}
	res2, _ := detector.Detect(ctx, sig2)
	if res2.Metadata["content_status"] != "DUPLICATE" || res2.Metadata["similarity_score"] != "1.00" {
		t.Errorf("expected DUPLICATE status with similarity 1.00, got status=%s sim=%s", res2.Metadata["content_status"], res2.Metadata["similarity_score"])
	}
	if res2.Metadata["original_source"] != "author_reuters" {
		t.Errorf("expected original source attribution author_reuters, got %s", res2.Metadata["original_source"])
	}

	// 6. Detect DERIVATIVE signal (Jaccard similarity > 0.85)
	sig3 := &domain.MonitorSignal{
		SignalID: "sig-deriv-3",
		TenantID: "tenant-dup-1",
		Author:   "author_summary",
		Content:  "Autonomous AI media platform deploys 32 specialized agents across global newsrooms today",
		Platform: domain.PlatformLinkedIn,
		Language: "en-US",
	}
	res3, _ := detector.Detect(ctx, sig3)
	if res3.Metadata["content_status"] != "DERIVATIVE" {
		t.Errorf("expected DERIVATIVE status for near-duplicate, got %s", res3.Metadata["content_status"])
	}

	// 7. Detect TRANSLATED signal (near-duplicate with different language code)
	sig4 := &domain.MonitorSignal{
		SignalID: "sig-trans-4",
		TenantID: "tenant-dup-1",
		Author:   "author_spain",
		Content:  "Autonomous AI media platform deploys 32 specialized agents across global newsrooms hoy",
		Platform: domain.PlatformReddit,
		Language: "es-MX",
	}
	res4, _ := detector.Detect(ctx, sig4)
	if res4.Metadata["content_status"] != "TRANSLATED" {
		t.Errorf("expected TRANSLATED status for different language code, got %s", res4.Metadata["content_status"])
	}
}

func TestDuplicateChecker_AnalyzeAndClassify(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewDuplicateChecker(ai, bus)
	_ = detector.Initialize(ctx, "tenant-dup-1", nil)

	sig := &domain.MonitorSignal{
		SignalID: "sig-dup-analyse-1",
		TenantID: "tenant-dup-1",
		Author:   "author_reuters",
		Content:  "Autonomous AI media platform deploys 32 specialized agents across global newsrooms",
		URL:      "https://x.com/author/1009",
		Platform: domain.PlatformTwitter,
	}

	// 1. Analyze routes through AIGatewayService
	res, err := detector.Analyze(ctx, sig)
	if err != nil || res == nil {
		t.Fatalf("unexpected error on Analyze: %v", err)
	}
	if res.Metadata["ai_semantic_comparison"] != "AI Summarized Breaking Event" {
		t.Errorf("expected AI semantic comparison from gateway, got %s", res.Metadata["ai_semantic_comparison"])
	}

	// 2. Classify returns content status, similarity score, and evidence items
	status, sim, evidence, err := detector.Classify(ctx, sig)
	if err != nil || len(evidence) == 0 {
		t.Fatalf("unexpected error on Classify: %v", err)
	}
	if status != "ORIGINAL" && status != "DUPLICATE" && status != "DERIVATIVE" && status != "TRANSLATED" {
		t.Errorf("unexpected content status: %s", status)
	}
	if sim < 0.0 || sim > 1.0 {
		t.Errorf("similarity score out of bounds: %f", sim)
	}
}
