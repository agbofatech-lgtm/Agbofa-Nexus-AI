package verification

import (
	"context"
	"errors"
	"math"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestConfidenceScoringAgentLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewConfidenceScorer(nil)
	ctx := context.Background()

	if agent.ID() != "AGT-024" || agent.Name() != "Confidence Scoring Agent" {
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

func TestConfidenceScoringAgentWeightedFormulaAndTiers(t *testing.T) {
	agent := NewConfidenceScorer(nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	testCases := []struct {
		s17, s18, s19, s21, s22 float64
		wantScore               float64
		wantTier                string
	}{
		// 0.30*0.9 + 0.25*0.9 + 0.20*0.9 + 0.15*0.9 + 0.10*0.9 = 0.90 -> VERIFIED_TRUTH
		{0.90, 0.90, 0.90, 0.90, 0.90, 0.90, "VERIFIED_TRUTH"},
		// 0.30*0.7 + 0.25*0.7 + 0.20*0.7 + 0.15*0.7 + 0.10*0.7 = 0.70 -> PROVISIONAL
		{0.70, 0.70, 0.70, 0.70, 0.70, 0.70, "PROVISIONAL"},
		// 0.30*0.4 + 0.25*0.4 + 0.20*0.4 + 0.15*0.4 + 0.10*0.4 = 0.40 -> DOUBTFUL
		{0.40, 0.40, 0.40, 0.40, 0.40, 0.40, "DOUBTFUL"},
	}

	for _, tc := range testCases {
		claim := &domain.Claim{
			ClaimID:   "clm-conf-" + tc.wantTier,
			TenantID:  "tenant-XYZ",
			ClaimText: "Test claim for tier " + tc.wantTier,
			Metadata: map[string]string{
				"override_agt17": "0.90",
			},
		}
		// Inject overrides for precise formula validation
		claim.Metadata["override_agt17"] = fmtFloat(tc.s17)
		claim.Metadata["override_agt18"] = fmtFloat(tc.s18)
		claim.Metadata["override_agt19"] = fmtFloat(tc.s19)
		claim.Metadata["override_agt21"] = fmtFloat(tc.s21)
		claim.Metadata["override_agt22"] = fmtFloat(tc.s22)

		res, err := agent.Verify(ctx, claim)
		if err != nil {
			t.Fatalf("unexpected error verifying tier %s: %v", tc.wantTier, err)
		}
		if res.Verdict != tc.wantTier || res.Classification != tc.wantTier {
			t.Fatalf("expected tier %s, got %s / %s", tc.wantTier, res.Verdict, res.Classification)
		}
		if math.Abs(res.ConfidenceScore-tc.wantScore) > 0.001 {
			t.Fatalf("expected score %.4f, got %.4f", tc.wantScore, res.ConfidenceScore)
		}
		if res.Metadata["final_arbiter"] != "true" {
			t.Fatalf("missing mandatory final_arbiter flag")
		}
	}
}

func TestConfidenceScoringAgentMissingSignalRedistribution(t *testing.T) {
	agent := NewConfidenceScorer(nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	claim := &domain.Claim{
		ClaimID:   "clm-redist",
		TenantID:  "tenant-XYZ",
		ClaimText: "Claim with missing AGT-021 signal",
		Metadata: map[string]string{
			"override_agt17": "0.85",
			"override_agt18": "0.85",
			"override_agt19": "0.85",
			"override_agt22": "0.85",
			"missing_agt21":  "true",
		},
	}

	res, err := agent.Verify(ctx, claim)
	if err != nil {
		t.Fatalf("unexpected error on Verify: %v", err)
	}

	if res.Metadata["weight_redistributed"] != "true" {
		t.Fatalf("expected weight_redistributed=true when AGT-021 signal is missing")
	}

	// All remaining components are 0.85, so normalized redistributed score should be exactly 0.85
	if math.Abs(res.ConfidenceScore-0.85) > 0.001 {
		t.Fatalf("expected redistributed score 0.85, got %.4f", res.ConfidenceScore)
	}
}

func TestConfidenceScoringAgentCorroborateAndAssess(t *testing.T) {
	agent := NewConfidenceScorer(nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	// Test anomaly detection where individual scores diverge significantly (max-min > 0.50)
	claim := &domain.Claim{
		ClaimID:   "clm-anomaly",
		TenantID:  "tenant-XYZ",
		ClaimText: "Claim with divergent component scores",
		Metadata: map[string]string{
			"override_agt17": "0.95",
			"override_agt18": "0.90",
			"override_agt19": "0.85",
			"override_agt21": "0.80",
			"override_agt22": "0.10", // divergence: 0.95 - 0.10 = 0.85 > 0.50 -> anomaly
		},
	}

	corrob, err := agent.Corroborate(ctx, claim, nil)
	if err != nil {
		t.Fatalf("unexpected error on Corroborate: %v", err)
	}
	if corrob.Metadata["scoring_anomaly"] != "true" {
		t.Fatalf("expected scoring_anomaly=true when individual component scores diverge > 0.50")
	}

	assess, err := agent.Assess(ctx, claim)
	if err != nil {
		t.Fatalf("unexpected error on Assess: %v", err)
	}
	if assess.AssessmentType != "CONFIDENCE_SCORING" {
		t.Fatalf("expected CONFIDENCE_SCORING assessment type, got %s", assess.AssessmentType)
	}

	// Ensure transparent scoring breakdown contains all 5 component scores plus final score and uncertainty metric
	expectedKeys := []string{
		"agt_017_fact_check",
		"agt_018_cross_ref",
		"agt_019_source_auth",
		"agt_021_evidence_strength",
		"agt_022_bias_inversion",
		"final_confidence_score",
		"uncertainty_metric",
	}
	for _, k := range expectedKeys {
		if _, exists := assess.ScoringBreakdown[k]; !exists {
			t.Fatalf("missing key %s in transparent scoring breakdown", k)
		}
	}
}

func fmtFloat(val float64) string {
	return strconv.FormatFloat(val, 'f', -1, 64)
}
