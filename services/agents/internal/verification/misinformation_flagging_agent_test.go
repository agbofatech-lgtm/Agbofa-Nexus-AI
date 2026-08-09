package verification

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestMisinformationFlaggingAgentLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewMisinformationFlagger(nil, nil)
	ctx := context.Background()

	if agent.ID() != "AGT-023" || agent.Name() != "Misinformation Flagging Agent" {
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

func TestMisinformationFlaggingAgentVerifyClassifications(t *testing.T) {
	agent := NewMisinformationFlagger(nil, nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	testCases := []struct {
		text      string
		wantClass string
	}{
		{"This humor satire parody article exaggerates for comic effect.", "SATIRE"},
		{"We leak and doxx private data out of context to cause damage.", "MALINFORMATION"},
		{"This coordinated election results manipulated hoax is deliberate deception.", "DISINFORMATION"},
		{"The national unemployment dropped to 0% according to unverified blog.", "MISINFORMATION"},
		{"The statistics bureau confirmed GDP grew by 4% in Q2.", "CLEAN"},
	}

	for _, tc := range testCases {
		claim := &domain.Claim{
			ClaimID:   "clm-misinfo-" + tc.wantClass,
			TenantID:  "tenant-XYZ",
			ClaimText: tc.text,
		}

		res, err := agent.Verify(ctx, claim)
		if err != nil {
			t.Fatalf("unexpected error verifying text %q: %v", tc.text, err)
		}
		if res.Verdict != tc.wantClass || res.Classification != tc.wantClass {
			t.Fatalf("for text %q: expected classification %s, got %s / %s",
				tc.text, tc.wantClass, res.Verdict, res.Classification)
		}
		if res.Metadata["suppression_policy"] != "NEVER_SUPPRESS_HUMAN_DECIDES" {
			t.Fatalf("missing mandatory NEVER_SUPPRESS_HUMAN_DECIDES suppression policy flag")
		}
		if res.Metadata["intent_distinction"] != "EVALUATED" {
			t.Fatalf("missing intent distinction evaluation flag")
		}
		if len(res.Evidence) == 0 {
			t.Fatalf("expected evidence item describing risk assessment")
		}
	}
}

func TestMisinformationFlaggingAgentCorroborateAndAssess(t *testing.T) {
	agent := NewMisinformationFlagger(nil, nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	claim := &domain.Claim{
		ClaimID:   "clm-misinfo-assess",
		TenantID:  "tenant-XYZ",
		ClaimText: "This coordinated election results manipulated hoax is deliberate deception.",
	}

	sources := []domain.Source{
		{SourceID: "src-1", Name: "FactCheck Org"},
	}

	corrob, err := agent.Corroborate(ctx, claim, sources)
	if err != nil {
		t.Fatalf("unexpected error on Corroborate: %v", err)
	}
	if corrob.SourceMatrix["src-1"] != "EXTERNAL_FACT_CHECK_FLAGGED:DISINFORMATION" {
		t.Fatalf("unexpected external fact check flag: %s", corrob.SourceMatrix["src-1"])
	}

	assess, err := agent.Assess(ctx, claim)
	if err != nil {
		t.Fatalf("unexpected error on Assess: %v", err)
	}
	if assess.AssessmentType != "MISINFORMATION_FLAGGING" || assess.Classification != "DISINFORMATION" {
		t.Fatalf("expected MISINFORMATION_FLAGGING / DISINFORMATION, got %s / %s", assess.AssessmentType, assess.Classification)
	}
	if assess.Metadata["misinformation_severity"] != "CRITICAL" { // risk 0.92 > 0.8
		t.Fatalf("expected CRITICAL severity, got %s", assess.Metadata["misinformation_severity"])
	}
	if assess.ScoringBreakdown["composite_risk"] < 0.90 {
		t.Fatalf("expected composite risk score in breakdown")
	}
}
