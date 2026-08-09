package verification

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestBiasDetectionAgentLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewBiasDetector(nil)
	ctx := context.Background()

	if agent.ID() != "AGT-022" || agent.Name() != "Bias Detection Agent" {
		t.Fatalf("unexpected agent identity: %s / %s", agent.ID(), agent.Name())
	}

	// Uninitialized health check should fail
	if _, err := agent.HealthCheck(ctx); err == nil {
		t.Fatalf("expected error on uninitialized health check")
	}

	// Empty tenant ID should return ErrCrossTenantViolation
	if err := agent.Initialize(ctx, "", nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID, got %v", err)
	}

	// Initialize with tenant-A
	if err := agent.Initialize(ctx, "tenant-A", nil); err != nil {
		t.Fatalf("unexpected initialization error: %v", err)
	}

	if health, err := agent.HealthCheck(ctx); err != nil || health.Status != "HEALTHY" {
		t.Fatalf("expected HEALTHY health check after initialize")
	}

	// Cross-tenant verification should be rejected
	crossClaim := &domain.Claim{
		ClaimID:  "clm-1",
		TenantID: "tenant-B",
	}
	if _, err := agent.Verify(ctx, crossClaim); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for cross-tenant claim")
	}

	// Shutdown
	_ = agent.Shutdown(ctx)
	if _, err := agent.HealthCheck(ctx); err == nil {
		t.Fatalf("expected error on health check after shutdown")
	}
}

func TestBiasDetectionAgentVerifyClassifications(t *testing.T) {
	agent := NewBiasDetector(nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	testCases := []struct {
		text      string
		wantClass string
	}{
		{"This corrupt partisan disaster will always destroy our institutions.", "POLITICAL"},
		{"Buy now and get our best product with guaranteed savings and exclusive deal!", "COMMERCIAL"},
		{"Their ethnocentric view assumes our superior way over foreign culture.", "CULTURAL"},
		{"By ignoring all other data and only showing cherry-picked stats, they mislead.", "SELECTION"},
		{"The central bank announced a 25 basis point rate adjustment today.", "NONE"},
	}

	for _, tc := range testCases {
		claim := &domain.Claim{
			ClaimID:      "clm-bias-" + tc.wantClass,
			TenantID:     "tenant-XYZ",
			ClaimText:    tc.text,
			IsVerifiable: true,
			Metadata: map[string]string{
				"language": "en-US",
			},
		}

		res, err := agent.Verify(ctx, claim)
		if err != nil {
			t.Fatalf("unexpected error verifying text %q: %v", tc.text, err)
		}
		if res.Verdict != tc.wantClass || res.Classification != tc.wantClass {
			t.Fatalf("for text %q: expected classification %s, got %s / %s", tc.text, tc.wantClass, res.Verdict, res.Classification)
		}

		// Check mandatory behavioral metadata flags
		if res.Metadata["truth_independence"] != "true" {
			t.Fatalf("missing mandatory truth_independence flag (bias != false)")
		}
		if res.Metadata["self_awareness_flag"] != "true" {
			t.Fatalf("missing mandatory self_awareness_flag")
		}
		if res.Metadata["language"] != "en-US" {
			t.Fatalf("expected cross-language tag en-US preserved, got %s", res.Metadata["language"])
		}
		if len(res.Evidence) == 0 {
			t.Fatalf("expected evidence items showing bias indicators and examples from text")
		}
	}
}

func TestBiasDetectionAgentCorroborateAndAssess(t *testing.T) {
	agent := NewBiasDetector(nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	claim := &domain.Claim{
		ClaimID:   "clm-bias-assess",
		TenantID:  "tenant-XYZ",
		ClaimText: "This corrupt partisan disaster will always destroy our institutions.",
	}

	sources := []domain.Source{
		{SourceID: "src-1", Name: "Partisan Gazette", Domain: "partisan.com"},
		{SourceID: "src-2", Name: "Neutral News", Domain: "neutral.org"},
	}

	corrob, err := agent.Corroborate(ctx, claim, sources)
	if err != nil {
		t.Fatalf("unexpected error on Corroborate: %v", err)
	}
	if len(corrob.SourceMatrix) != 2 {
		t.Fatalf("expected source matrix for 2 sources")
	}

	assess, err := agent.Assess(ctx, claim)
	if err != nil {
		t.Fatalf("unexpected error on Assess: %v", err)
	}
	if assess.AssessmentType != "BIAS_DETECTION" || assess.Classification != "POLITICAL" {
		t.Fatalf("expected BIAS_DETECTION / POLITICAL assessment, got %s / %s", assess.AssessmentType, assess.Classification)
	}
	if assess.ScoringBreakdown["truth_independence"] != 1.0 {
		t.Fatalf("expected truth_independence score in breakdown")
	}
}
