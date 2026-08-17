package verification

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestClaimExtractionAgentLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewClaimExtractor(nil)
	ctx := context.Background()

	if agent.ID() != "AGT-020" || agent.Name() != "Claim Extraction Agent" {
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

func TestClaimExtractionAgentVerifyClaimTypes(t *testing.T) {
	agent := NewClaimExtractor(nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	narrative := "The central bank raised interest rates by 50 percent today. " +
		"The minister stated \"inflation must be stopped\". " +
		"Analysts predict markets will settle by next month. " +
		"We believe this policy is the best approach. " +
		"The stock exchange opened higher this morning."

	claim := &domain.Claim{
		ClaimID:     "clm-narrative-001",
		TenantID:    "tenant-XYZ",
		SignalID:    "sig-001",
		ContentText: narrative,
	}

	res, err := agent.Verify(ctx, claim)
	if err != nil {
		t.Fatalf("unexpected error on Verify: %v", err)
	}
	if res.Verdict != "CLAIMS_EXTRACTED" {
		t.Fatalf("expected verdict CLAIMS_EXTRACTED, got %s", res.Verdict)
	}

	if len(res.Evidence) != 5 {
		t.Fatalf("expected 5 extracted claims in evidence inventory, got %d", len(res.Evidence))
	}

	foundTypes := make(map[string]bool)
	for _, ev := range res.Evidence {
		ct := ev.Metadata["claim_type"]
		foundTypes[ct] = true

		switch ct {
		case "STATISTICAL", "QUOTATION", "FACTUAL":
			if ev.Metadata["is_verifiable"] != "true" {
				t.Fatalf("expected claim type %s to be verifiable=true", ct)
			}
		case "PREDICTION", "OPINION":
			if ev.Metadata["is_verifiable"] != "false" {
				t.Fatalf("expected claim type %s to be verifiable=false", ct)
			}
		}
	}

	requiredTypes := []string{"STATISTICAL", "QUOTATION", "PREDICTION", "OPINION", "FACTUAL"}
	for _, req := range requiredTypes {
		if !foundTypes[req] {
			t.Fatalf("missing required claim type %s in extracted inventory", req)
		}
	}
}

func TestClaimExtractionAgentCorroborateAndAssess(t *testing.T) {
	agent := NewClaimExtractor(nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	claim := &domain.Claim{
		ClaimID:   "clm-test-inv",
		TenantID:  "tenant-XYZ",
		ClaimText: "Unemployment stands at 3 percent. Analysts expect job growth will slow.",
	}

	corrob, err := agent.Corroborate(ctx, claim, nil)
	if err != nil {
		t.Fatalf("unexpected error on Corroborate: %v", err)
	}
	if corrob.Corroborated || corrob.Metadata["note"] == "" {
		t.Fatalf("expected Corroborate to return false and structured note")
	}

	assess, err := agent.Assess(ctx, claim)
	if err != nil {
		t.Fatalf("unexpected error on Assess: %v", err)
	}
	if assess.AssessmentType != "CLAIM_EXTRACTION" || assess.Classification != "INVENTORY_READY" {
		t.Fatalf("expected CLAIM_EXTRACTION / INVENTORY_READY, got %s / %s", assess.AssessmentType, assess.Classification)
	}

	if assess.ScoringBreakdown["total_claims"] != 2 {
		t.Fatalf("expected 2 total claims in scoring breakdown, got %v", assess.ScoringBreakdown["total_claims"])
	}
	if assess.ScoringBreakdown["verifiable_claims"] != 1 || assess.ScoringBreakdown["non_verifiable_claims"] != 1 {
		t.Fatalf("expected 1 verifiable and 1 non-verifiable claim, got %v / %v",
			assess.ScoringBreakdown["verifiable_claims"], assess.ScoringBreakdown["non_verifiable_claims"])
	}
}
