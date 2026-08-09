package detectors

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestCrossMediaVerifier_LifecycleAndTenantIsolation(t *testing.T) {
	ctx := context.Background()
	verifier := NewCrossMediaConsistencyVerifier(nil, nil)

	if verifier.ID() != "AGT-013-CROSS" || verifier.Name() != "Cross-Media Consistency Verifier" {
		t.Fatalf("unexpected identity: %s / %s", verifier.ID(), verifier.Name())
	}

	// Uninitialized health check should fail
	if _, err := verifier.HealthCheck(ctx); err == nil {
		t.Fatalf("expected error on uninitialized health check")
	}

	// Empty tenant ID should return ErrCrossTenantViolation
	if err := verifier.Initialize(ctx, "", nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID, got %v", err)
	}

	// Initialize with tenant-A
	if err := verifier.Initialize(ctx, "tenant-A", nil); err != nil {
		t.Fatalf("unexpected initialization error: %v", err)
	}

	if health, err := verifier.HealthCheck(ctx); err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health check after initialize")
	}

	// Cross-tenant operation should be rejected
	crossSig := &domain.MonitorSignal{
		SignalID: "sig-1",
		TenantID: "tenant-B",
	}
	if _, err := verifier.Detect(ctx, crossSig); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for cross-tenant signal")
	}

	// Shutdown
	_ = verifier.Shutdown(ctx)
	if _, err := verifier.HealthCheck(ctx); err == nil {
		t.Fatalf("expected error on health check after shutdown")
	}
}

func TestCrossMediaVerifier_NotApplicableAndArtistic(t *testing.T) {
	ctx := context.Background()
	verifier := NewCrossMediaConsistencyVerifier(nil, nil)
	_ = verifier.Initialize(ctx, "tenant-XYZ", nil)

	// 1. Single-media story -> NOT_APPLICABLE
	sigSingle := &domain.MonitorSignal{
		SignalID: "sig-single",
		TenantID: "tenant-XYZ",
		Metadata: map[string]string{
			"media_types": "IMAGE",
		},
	}
	resSingle, err := verifier.Detect(ctx, sigSingle)
	if err != nil {
		t.Fatalf("unexpected error on single media detect: %v", err)
	}
	if resSingle.Classification != "NOT_APPLICABLE" {
		t.Fatalf("expected NOT_APPLICABLE for single-media story, got %s", resSingle.Classification)
	}

	// 2. Artistic expression / opinion -> CONSISTENT (never flag as inconsistency)
	sigArt := &domain.MonitorSignal{
		SignalID: "sig-art",
		TenantID: "tenant-XYZ",
		Metadata: map[string]string{
			"media_types":         "IMAGE,VIDEO",
			"artistic_expression": "true",
		},
	}
	resArt, _ := verifier.Detect(ctx, sigArt)
	if resArt.Classification != "CONSISTENT" {
		t.Fatalf("expected CONSISTENT for artistic expression, got %s", resArt.Classification)
	}
}

func TestCrossMediaVerifier_ContradictionsAndConsistencies(t *testing.T) {
	ctx := context.Background()
	verifier := NewCrossMediaConsistencyVerifier(nil, nil)
	_ = verifier.Initialize(ctx, "tenant-XYZ", nil)

	// 1. Factual contradiction across OCR and transcript -> INCONSISTENT_CROSS_MEDIA
	sigContra := &domain.MonitorSignal{
		SignalID: "sig-contra",
		TenantID: "tenant-XYZ",
		Metadata: map[string]string{
			"media_types":   "IMAGE,AUDIO",
			"ocr_text":      "GDP up 4% contradict",
			"transcription": "GDP down 10% contradict",
		},
	}
	resContra, err := verifier.Detect(ctx, sigContra)
	if err != nil {
		t.Fatalf("unexpected error on contradiction check: %v", err)
	}
	if resContra.ConfidenceScore >= 1.0 {
		t.Fatalf("expected consistency score < 1.0 on contradiction, got %.2f", resContra.ConfidenceScore)
	}
	if resContra.Classification == "CONSISTENT" {
		t.Fatalf("expected inconsistency classification, got %s", resContra.Classification)
	}

	// 2. Corroborated cross-media -> CROSS_MEDIA_CORROBORATED
	sigCorrob := &domain.MonitorSignal{
		SignalID: "sig-corrob",
		TenantID: "tenant-XYZ",
		Metadata: map[string]string{
			"media_types":   "IMAGE,AUDIO",
			"ocr_text":      "GDP up 4%",
			"transcription": "GDP up 4%",
			"entities":      "CentralBank,GDP",
		},
	}
	resCorrob, _ := verifier.Detect(ctx, sigCorrob)
	if resCorrob.Classification != "CONSISTENT" || resCorrob.ConfidenceScore != 1.0 {
		t.Fatalf("expected CONSISTENT / 1.0 on corroborated media, got %s / %.2f", resCorrob.Classification, resCorrob.ConfidenceScore)
	}
}

func TestCrossMediaVerifier_VerifyCrossMediaPayload(t *testing.T) {
	ctx := context.Background()
	verifier := NewCrossMediaConsistencyVerifier(nil, nil)
	_ = verifier.Initialize(ctx, "tenant-XYZ", nil)

	payload := &domain.PipelinePayload{
		PayloadID: "pay-100",
		TenantID:  "tenant-XYZ",
		SignalID:  "sig-100",
		Metadata: map[string]string{
			"media_types": "IMAGE,VIDEO",
			"ocr_text":    "GDP up 4% contradict",
		},
	}
	res, err := verifier.VerifyCrossMedia(ctx, payload)
	if err != nil || res == nil {
		t.Fatalf("unexpected error on VerifyCrossMedia: %v", err)
	}
}
