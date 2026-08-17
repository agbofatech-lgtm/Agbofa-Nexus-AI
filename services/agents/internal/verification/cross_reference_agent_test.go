package verification

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestCrossReferenceAgentLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewCrossRefAgent()
	ctx := context.Background()

	if agent.ID() != "AGT-018" || agent.Name() != "Cross-Reference Agent" {
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

func TestCrossReferenceAgentCorroborateIndependence(t *testing.T) {
	agent := NewCrossRefAgent()
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	claim := &domain.Claim{
		ClaimID:      "clm-ind-1",
		TenantID:     "tenant-XYZ",
		ClaimText:    "Central bank lowered interest rate by 50 bps",
		ClaimType:    "STATEMENT_OF_FACT",
		IsVerifiable: true,
	}

	// Case 1: 3 sources where 2 share the same ParentCompany -> 2 independent sources
	sharedSources := []domain.Source{
		{
			SourceID:      "src-1",
			Name:          "Daily Financial",
			ParentCompany: "Media Conglomerate A",
			URL:           "https://daily-financial.com",
		},
		{
			SourceID:      "src-2",
			Name:          "Evening Gazette",
			ParentCompany: "Media Conglomerate A", // Same parent! Not independent.
			URL:           "https://evening-gazette.com",
		},
		{
			SourceID:      "src-3",
			Name:          "Independent Wire News",
			ParentCompany: "Independent Org B",
			URL:           "https://independent-wire.org",
		},
	}

	res1, err := agent.Corroborate(ctx, claim, sharedSources)
	if err != nil {
		t.Fatalf("unexpected error on Corroborate: %v", err)
	}
	if res1.TotalSourceCount != 3 {
		t.Fatalf("expected total 3 sources, got %d", res1.TotalSourceCount)
	}
	if res1.IndependentSourceCount != 2 {
		t.Fatalf("expected 2 independent sources, got %d", res1.IndependentSourceCount)
	}
	if !res1.Corroborated {
		t.Fatalf("expected corroborated = true for 2 independent sources")
	}

	// Case 2: 2 sources where BOTH share the same ParentCompany -> 1 independent source (not corroborated)
	syndicatedOnly := []domain.Source{
		{
			SourceID:      "src-10",
			Name:          "Local Partner A",
			ParentCompany: "Global News Network",
		},
		{
			SourceID:      "src-11",
			Name:          "Local Partner B",
			ParentCompany: "Global News Network",
		},
	}
	res2, err := agent.Corroborate(ctx, claim, syndicatedOnly)
	if err != nil {
		t.Fatalf("unexpected error on Corroborate: %v", err)
	}
	if res2.IndependentSourceCount != 1 || res2.Corroborated {
		t.Fatalf("expected 1 independent source and corroborated=false, got %d / %v", res2.IndependentSourceCount, res2.Corroborated)
	}

	// Case 3: Fallback to defaultSources (5 sources, 4 independent)
	res3, err := agent.Corroborate(ctx, claim, nil)
	if err != nil {
		t.Fatalf("unexpected error on default Corroborate: %v", err)
	}
	if res3.TotalSourceCount != 5 || res3.IndependentSourceCount != 4 || !res3.Corroborated {
		t.Fatalf("expected default sources to have 5 total, 4 independent, corroborated=true; got %d / %d / %v", res3.TotalSourceCount, res3.IndependentSourceCount, res3.Corroborated)
	}
}

func TestCrossReferenceAgentVerifyAndAssess(t *testing.T) {
	agent := NewCrossRefAgent()
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	claim := &domain.Claim{
		ClaimID:      "clm-verify-1",
		TenantID:     "tenant-XYZ",
		ClaimText:    "Inflation dropped in EU zone",
		ClaimType:    "STATEMENT_OF_FACT",
		IsVerifiable: true,
	}

	// Verify with default 4 independent sources -> TRUE
	verif, err := agent.Verify(ctx, claim)
	if err != nil {
		t.Fatalf("unexpected error on Verify: %v", err)
	}
	if verif.Verdict != "TRUE" || verif.ConfidenceScore < 0.90 {
		t.Fatalf("expected verdict TRUE and high confidence, got %s / %.2f", verif.Verdict, verif.ConfidenceScore)
	}
	if len(verif.Sources) < 2 {
		t.Fatalf("expected at least 2 corroborating sources in verification result")
	}

	// Assess strength across different independent source counts
	assessCases := []struct {
		sources      []domain.Source
		wantStrength string
		wantConf     float64
	}{
		{
			sources: []domain.Source{
				{SourceID: "s1", ParentCompany: "Corp A"},
				{SourceID: "s2", ParentCompany: "Corp B"},
				{SourceID: "s3", ParentCompany: "Corp C"},
			},
			wantStrength: "STRONG",
			wantConf:     0.95,
		},
		{
			sources: []domain.Source{
				{SourceID: "s1", ParentCompany: "Corp A"},
				{SourceID: "s2", ParentCompany: "Corp B"},
			},
			wantStrength: "MODERATE",
			wantConf:     0.75,
		},
		{
			sources: []domain.Source{
				{SourceID: "s1", ParentCompany: "Corp A"},
				{SourceID: "s2", ParentCompany: "Corp A"},
			},
			wantStrength: "WEAK",
			wantConf:     0.50,
		},
	}

	for _, tc := range assessCases {
		corrob, _ := agent.Corroborate(ctx, claim, tc.sources)
		var strength string
		switch {
		case corrob.IndependentSourceCount >= 3:
			strength = "STRONG"
		case corrob.IndependentSourceCount == 2:
			strength = "MODERATE"
		case corrob.IndependentSourceCount == 1:
			strength = "WEAK"
		default:
			strength = "NONE"
		}
		if strength != tc.wantStrength || corrob.ConfidenceScore != tc.wantConf {
			t.Fatalf("for %d independent sources: expected strength %s / conf %.2f; got %s / %.2f",
				corrob.IndependentSourceCount, tc.wantStrength, tc.wantConf, strength, corrob.ConfidenceScore)
		}
	}

	// Test default Assess call
	assessRes, err := agent.Assess(ctx, claim)
	if err != nil {
		t.Fatalf("unexpected error on default Assess: %v", err)
	}
	if assessRes.AssessmentType != "CROSS_REFERENCE" || assessRes.Classification != "STRONG" {
		t.Fatalf("expected CROSS_REFERENCE / STRONG assessment, got %s / %s", assessRes.AssessmentType, assessRes.Classification)
	}
}
