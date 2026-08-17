package domain

import (
	"testing"
	"time"
)

func TestVerificationResultProperties(t *testing.T) {
	res := &VerificationResult{
		VerificationID:    "ver-100",
		TenantID:          "tenant-xyz",
		SignalID:          "sig-100",
		DetectionID:       "det-100",
		AgentID:           "AGT-017",
		AgentName:         "Fact-Checking Agent",
		Status:            VerificationStatusVerified,
		ConfidenceScore:   0.94,
		UncertaintyMetric: 0.06,
		Evidence: []EvidenceItem{
			{
				EvidenceID:  "ev-ver-1",
				Type:        "CORROBORATION",
				Description: "Corroborated by primary source",
				Confidence:  0.94,
			},
		},
		VerifiedAt: time.Now(),
	}

	if res.VerificationID != "ver-100" || res.AgentID != "AGT-017" || res.ConfidenceScore != 0.94 {
		t.Fatalf("unexpected verification result properties")
	}
	if res.Status != VerificationStatusVerified {
		t.Fatalf("expected VERIFIED status, got %s", res.Status)
	}
	if len(res.Evidence) != 1 || res.Evidence[0].EvidenceID != "ev-ver-1" {
		t.Fatalf("unexpected evidence item in verification result")
	}
}

func TestClaimExtractAndBiasAssessmentProperties(t *testing.T) {
	claim := &ClaimExtract{
		ClaimID:      "clm-1",
		TenantID:     "tenant-xyz",
		ClaimText:    "Unemployment dropped 2%",
		ClaimType:    "STATISTICAL",
		IsVerifiable: true,
	}
	if !claim.IsVerifiable || claim.ClaimType != "STATISTICAL" {
		t.Fatalf("unexpected claim extract properties")
	}

	bias := &BiasAssessment{
		AssessmentID:  "bias-1",
		TenantID:      "tenant-xyz",
		BiasScore:     0.15,
		EditorialBias: "NEUTRAL",
	}
	if bias.BiasScore != 0.15 || bias.EditorialBias != "NEUTRAL" {
		t.Fatalf("unexpected bias assessment properties")
	}
}

func TestEventTypeVerificationCompletedConstant(t *testing.T) {
	if EventTypeVerificationCompleted != "EVT-021" {
		t.Fatalf("expected EVT-021, got %s", EventTypeVerificationCompleted)
	}
}

func TestIMP017CVerificationDomainProperties(t *testing.T) {
	claim := &Claim{
		ClaimID:      "claim-001",
		TenantID:     "tenant-001",
		ClaimText:    "GDP grew by 4% in Q2",
		ClaimType:    "STATEMENT_OF_FACT",
		IsVerifiable: true,
		ExtractedAt:  time.Now(),
	}
	if claim.ClaimID != "claim-001" || !claim.IsVerifiable {
		t.Fatalf("unexpected claim properties")
	}

	src := Source{
		SourceID:        "src-001",
		TenantID:        "tenant-001",
		Name:            "Official Stats Bureau",
		Domain:          "stats.gov",
		AuthorityScore:  0.95,
		CredibilityTier: "HIGH",
		IsIndependent:   true,
	}
	if src.AuthorityScore != 0.95 || !src.IsIndependent {
		t.Fatalf("unexpected source properties")
	}

	corrob := &CorroborationResult{
		ResultID:               "corrob-001",
		TenantID:               "tenant-001",
		ClaimID:                claim.ClaimID,
		Corroborated:           true,
		IndependentSourceCount: 2,
		ConfidenceScore:        0.92,
		CorroboratingSources:   []Source{src},
	}
	if !corrob.Corroborated || corrob.IndependentSourceCount != 2 {
		t.Fatalf("unexpected corroboration properties")
	}

	assessment := &AssessmentResult{
		AssessmentID:    "assess-001",
		TenantID:        "tenant-001",
		ClaimID:         claim.ClaimID,
		AssessmentType:  "BIAS",
		Classification:  "NONE",
		ConfidenceScore: 0.90,
		RiskScore:       0.05,
	}
	if assessment.AssessmentType != "BIAS" || assessment.Classification != "NONE" {
		t.Fatalf("unexpected assessment properties")
	}
}
