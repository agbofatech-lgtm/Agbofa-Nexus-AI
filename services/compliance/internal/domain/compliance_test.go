package domain_test

import (
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/compliance/internal/domain"
)

func TestComplianceStatePolicy_ValidTransitions(t *testing.T) {
	policy := domain.ComplianceStatePolicy{}

	validPairs := [][2]domain.ComplianceStatus{
		{domain.ComplianceStatusCompliant, domain.ComplianceStatusReviewRequired},
		{domain.ComplianceStatusReviewRequired, domain.ComplianceStatusCompliant},
		{domain.ComplianceStatusCompliant, domain.ComplianceStatusRejected},
		{domain.ComplianceStatusReviewRequired, domain.ComplianceStatusRejected},
	}

	for _, pair := range validPairs {
		if err := policy.ValidateTransition(pair[0], pair[1]); err != nil {
			t.Fatalf("expected valid transition from %s to %s, got %v", pair[0], pair[1], err)
		}
	}
}

func TestComplianceStatePolicy_InvalidTransitions(t *testing.T) {
	policy := domain.ComplianceStatePolicy{}

	if err := policy.ValidateTransition(domain.ComplianceStatusRejected, domain.ComplianceStatusCompliant); !errors.Is(err, domain.ErrInvalidComplianceTransition) {
		t.Fatalf("expected ErrInvalidComplianceTransition out of REJECTED, got %v", err)
	}
}

func TestComplianceScoringPolicy_EvaluateOverallCompliance(t *testing.T) {
	policy := domain.ComplianceScoringPolicy{}

	rights := domain.RightsResult{Passed: true, Score: 0.95}
	orig := domain.OriginalityResult{Passed: true, Score: 0.95, MaxSimilarityPercent: 10.0}
	legal := domain.LegalResult{Passed: true, Score: 0.90}
	priv := domain.PrivacyResult{Passed: true, Score: 0.95, PIIDetected: false}
	safe := domain.AISafetyResult{Passed: true, Score: 0.95, MisinfoFlagInherited: false}
	pol := domain.PlatformPolicyResult{Passed: true, Score: 0.95}

	score, status, violations := policy.EvaluateOverallCompliance(rights, orig, legal, priv, safe, pol)
	if status != domain.ComplianceStatusCompliant || score < 0.90 || len(violations) > 0 {
		t.Fatalf("expected COMPLIANT, got status=%s score=%.2f violations=%v", status, score, violations)
	}

	privPII := domain.PrivacyResult{Passed: false, Score: 0.20, PIIDetected: true}
	score, status, violations = policy.EvaluateOverallCompliance(rights, orig, legal, privPII, safe, pol)
	if status != domain.ComplianceStatusRejected || score != 0.20 || len(violations) == 0 {
		t.Fatalf("expected REJECTED on PII detected, got status=%s score=%.2f", status, score)
	}
}

func TestGenerateComplianceHash(t *testing.T) {
	ts := time.Now().Unix()
	h1 := domain.GenerateComplianceHash("tenant-1", "pkg-1", "RIGHTS", "COMPLIANT", "SVC-058", ts)
	h2 := domain.GenerateComplianceHash("tenant-1", "pkg-1", "RIGHTS", "COMPLIANT", "SVC-058", ts)
	if h1 != h2 || len(h1) != 64 {
		t.Fatalf("expected deterministic 64-char sha256 hex hash, got %s", h1)
	}
}
