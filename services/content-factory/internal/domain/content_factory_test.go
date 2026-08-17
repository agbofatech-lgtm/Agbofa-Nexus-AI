package domain_test

import (
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/content-factory/internal/domain"
)

func TestPackageStatePolicy_ValidTransitions(t *testing.T) {
	policy := domain.PackageStatePolicy{}

	validPairs := [][2]domain.PackageStatus{
		{domain.PackageStatusDraft, domain.PackageStatusQAPassed},
		{domain.PackageStatusDraft, domain.PackageStatusReviewRequired},
		{domain.PackageStatusQAPassed, domain.PackageStatusApproved},
		{domain.PackageStatusReviewRequired, domain.PackageStatusApproved},
		{domain.PackageStatusDraft, domain.PackageStatusRejected},
	}

	for _, pair := range validPairs {
		if err := policy.ValidateTransition(pair[0], pair[1]); err != nil {
			t.Fatalf("expected valid transition from %s to %s, got %v", pair[0], pair[1], err)
		}
	}
}

func TestPackageStatePolicy_InvalidTransitions(t *testing.T) {
	policy := domain.PackageStatePolicy{}

	invalidPairs := [][2]domain.PackageStatus{
		{domain.PackageStatusDraft, domain.PackageStatusApproved},
		{domain.PackageStatusApproved, domain.PackageStatusDraft},
		{domain.PackageStatusRejected, domain.PackageStatusApproved},
	}

	for _, pair := range invalidPairs {
		if err := policy.ValidateTransition(pair[0], pair[1]); !errors.Is(err, domain.ErrInvalidPackageTransition) {
			t.Fatalf("expected ErrInvalidPackageTransition from %s to %s, got %v", pair[0], pair[1], err)
		}
	}
}

func TestQAQualityPolicy_ValidateQAScore(t *testing.T) {
	policy := domain.QAQualityPolicy{}

	passed, status := policy.ValidateQAScore(0.90, 0.85, nil)
	if !passed || status != domain.PackageStatusQAPassed {
		t.Fatalf("expected QA_PASSED, got passed=%v status=%s", passed, status)
	}

	passed, status = policy.ValidateQAScore(0.75, 0.85, []string{"minor readability note"})
	if passed || status != domain.PackageStatusReviewRequired {
		t.Fatalf("expected REVIEW_REQUIRED, got passed=%v status=%s", passed, status)
	}

	passed, status = policy.ValidateQAScore(0.50, 0.85, []string{"critical quality failure"})
	if passed || status != domain.PackageStatusRejected {
		t.Fatalf("expected REJECTED, got passed=%v status=%s", passed, status)
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
