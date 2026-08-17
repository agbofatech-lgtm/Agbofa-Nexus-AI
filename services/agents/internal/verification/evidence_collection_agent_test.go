package verification

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestEvidenceCollectionAgentLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewEvidenceCollector(nil)
	ctx := context.Background()

	if agent.ID() != "AGT-021" || agent.Name() != "Evidence Collection Agent" {
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

func TestEvidenceCollectionAgentVerifyAndWeighting(t *testing.T) {
	agent := NewEvidenceCollector(nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	// 1. Check supported claim with primary .gov source ranking highest
	claimSupported := &domain.Claim{
		ClaimID:      "clm-ev-sup",
		TenantID:     "tenant-XYZ",
		ClaimText:    "gdp grew by 4%",
		IsVerifiable: true,
	}

	resSup, err := agent.Verify(ctx, claimSupported)
	if err != nil {
		t.Fatalf("unexpected error on supported claim verification: %v", err)
	}
	if resSup.Verdict != "EVIDENCE_SUPPORTED" {
		t.Fatalf("expected EVIDENCE_SUPPORTED, got %s", resSup.Verdict)
	}
	if len(resSup.Evidence) != 3 {
		t.Fatalf("expected 3 evidence items for GDP claim, got %d", len(resSup.Evidence))
	}
	// First ranked item must be the primary .gov source
	if resSup.Evidence[0].Metadata["source_type"] != "PRIMARY" || resSup.Evidence[0].Confidence < 0.95 {
		t.Fatalf("expected primary official source ranked first with high reliability")
	}

	// 2. Check uncatalogued claim -> returns empty evidence list (NEVER FABRICATE EVIDENCE rule)
	claimUnknown := &domain.Claim{
		ClaimID:      "clm-ev-unk",
		TenantID:     "tenant-XYZ",
		ClaimText:    "Unknown obscure claim with no records",
		IsVerifiable: true,
	}
	resUnk, err := agent.Verify(ctx, claimUnknown)
	if err != nil {
		t.Fatalf("unexpected error on unknown claim: %v", err)
	}
	if len(resUnk.Evidence) != 0 || resUnk.Verdict != "NO_EVIDENCE_FOUND" {
		t.Fatalf("expected 0 evidence items and NO_EVIDENCE_FOUND for uncatalogued claim (never fabricate evidence)")
	}

	// 3. Check conflicting claim -> returns both stances and CONFLICTING_EVIDENCE
	claimConf := &domain.Claim{
		ClaimID:      "clm-ev-conf",
		TenantID:     "tenant-XYZ",
		ClaimText:    "conflicting trade deficit numbers",
		IsVerifiable: true,
	}
	resConf, err := agent.Verify(ctx, claimConf)
	if err != nil {
		t.Fatalf("unexpected error on conflicting claim: %v", err)
	}
	if resConf.Verdict != "CONFLICTING_EVIDENCE" {
		t.Fatalf("expected CONFLICTING_EVIDENCE verdict, got %s", resConf.Verdict)
	}
}

func TestEvidenceCollectionAgentCorroborateAndAssess(t *testing.T) {
	agent := NewEvidenceCollector(nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	claim := &domain.Claim{
		ClaimID:      "clm-ev-assess",
		TenantID:     "tenant-XYZ",
		ClaimText:    "gdp grew by 4%",
		IsVerifiable: true,
	}

	corrob, err := agent.Corroborate(ctx, claim, nil)
	if err != nil {
		t.Fatalf("unexpected error on Corroborate: %v", err)
	}
	if !corrob.Corroborated || corrob.IndependentSourceCount != 3 {
		t.Fatalf("expected corroboration across 3 evidence items")
	}

	assess, err := agent.Assess(ctx, claim)
	if err != nil {
		t.Fatalf("unexpected error on Assess: %v", err)
	}
	if assess.AssessmentType != "EVIDENCE_COLLECTION" || assess.Classification != "MODERATE" { // 2 supporting items -> MODERATE
		t.Fatalf("expected EVIDENCE_COLLECTION / MODERATE assessment, got %s / %s", assess.AssessmentType, assess.Classification)
	}
	if assess.ScoringBreakdown["supporting_count"] != 2 || assess.ScoringBreakdown["neutral_count"] != 1 {
		t.Fatalf("unexpected scoring breakdown counts: %v", assess.ScoringBreakdown)
	}
}
