package domain_test

import (
	"errors"
	"testing"


	"github.com/agbofa/nexus/services/operations/internal/domain"
)

func TestReleaseGatePolicy_EvaluatePromotionEligibility(t *testing.T) {
	policy := domain.ReleaseGatePolicy{}

	allPass := []domain.ReleaseGateEvaluation{
		{GateName: domain.GateCodeQuality, Status: domain.GateStatusPass, EvidenceRef: "ev-01"},
		{GateName: domain.GateTests, Status: domain.GateStatusPass, EvidenceRef: "ev-02"},
		{GateName: domain.GateBuild, Status: domain.GateStatusPass, EvidenceRef: "ev-03"},
		{GateName: domain.GateDependencyValidation, Status: domain.GateStatusPass, EvidenceRef: "ev-04"},
		{GateName: domain.GateSecurity, Status: domain.GateStatusPass, EvidenceRef: "ev-05"},
		{GateName: domain.GateMigrations, Status: domain.GateStatusPass, EvidenceRef: "ev-06"},
		{GateName: domain.GateGovernance, Status: domain.GateStatusPass, EvidenceRef: "ev-07"},
	}

	ok, failures := policy.EvaluatePromotionEligibility(allPass)
	if !ok || len(failures) > 0 {
		t.Fatalf("expected promotion eligibility to pass, got ok=%v failures=%v", ok, failures)
	}

	missingEvidence := []domain.ReleaseGateEvaluation{
		{GateName: domain.GateCodeQuality, Status: domain.GateStatusPass, EvidenceRef: ""}, // empty evidence
		{GateName: domain.GateTests, Status: domain.GateStatusPass, EvidenceRef: "ev-02"},
		{GateName: domain.GateBuild, Status: domain.GateStatusPass, EvidenceRef: "ev-03"},
		{GateName: domain.GateDependencyValidation, Status: domain.GateStatusPass, EvidenceRef: "ev-04"},
		{GateName: domain.GateSecurity, Status: domain.GateStatusPass, EvidenceRef: "ev-05"},
		{GateName: domain.GateMigrations, Status: domain.GateStatusPass, EvidenceRef: "ev-06"},
		{GateName: domain.GateGovernance, Status: domain.GateStatusPass, EvidenceRef: "ev-07"},
	}

	ok, failures = policy.EvaluatePromotionEligibility(missingEvidence)
	if ok || len(failures) != 1 {
		t.Fatalf("expected failure due to missing evidence, got ok=%v failures=%v", ok, failures)
	}
}

func TestEnvironmentPromotionPolicy_Path(t *testing.T) {
	policy := domain.EnvironmentPromotionPolicy{}

	if err := policy.ValidatePromotionPath(domain.EnvDevelopment, domain.EnvTestValidation); err != nil {
		t.Fatalf("expected valid promotion path, got %v", err)
	}

	if err := policy.ValidatePromotionPath(domain.EnvDevelopment, domain.EnvProduction); !errors.Is(err, domain.ErrInvalidEnvironmentPath) {
		t.Fatalf("expected ErrInvalidEnvironmentPath when skipping staging, got %v", err)
	}
}

func TestValidateTenantIsolation(t *testing.T) {
	if err := domain.ValidateTenantIsolation("tenant-1", "tenant-1"); err != nil {
		t.Fatalf("expected same tenant to pass, got %v", err)
	}
	if err := domain.ValidateTenantIsolation("tenant-1", "tenant-2"); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}
}
