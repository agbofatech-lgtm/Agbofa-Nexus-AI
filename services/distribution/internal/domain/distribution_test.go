package domain_test

import (
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/distribution/internal/domain"
)

func TestDeliveryStatePolicy_ValidTransitions(t *testing.T) {
	policy := domain.DeliveryStatePolicy{}

	validPairs := [][2]domain.DeliveryStatus{
		{domain.DeliveryStatusScheduled, domain.DeliveryStatusDelivering},
		{domain.DeliveryStatusDelivering, domain.DeliveryStatusDelivered},
		{domain.DeliveryStatusDelivering, domain.DeliveryStatusRetrying},
		{domain.DeliveryStatusRetrying, domain.DeliveryStatusDelivering},
		{domain.DeliveryStatusDelivered, domain.DeliveryStatusCorrected},
		{domain.DeliveryStatusDelivered, domain.DeliveryStatusRetracted},
	}

	for _, pair := range validPairs {
		if err := policy.ValidateTransition(pair[0], pair[1]); err != nil {
			t.Fatalf("expected valid transition from %s to %s, got %v", pair[0], pair[1], err)
		}
	}
}

func TestDeliveryStatePolicy_InvalidTransitions(t *testing.T) {
	policy := domain.DeliveryStatePolicy{}

	if err := policy.ValidateTransition(domain.DeliveryStatusDelivered, domain.DeliveryStatusScheduled); !errors.Is(err, domain.ErrInvalidDeliveryTransition) {
		t.Fatalf("expected ErrInvalidDeliveryTransition out of DELIVERED to SCHEDULED, got %v", err)
	}
}

func TestComplianceBoundaryPolicy_ValidatePackageForDistribution(t *testing.T) {
	policy := domain.ComplianceBoundaryPolicy{}

	if err := policy.ValidatePackageForDistribution("pkg-1", "APPROVED"); err != nil {
		t.Fatalf("expected APPROVED to pass, got %v", err)
	}

	if err := policy.ValidatePackageForDistribution("pkg-2", "COMPLIANT"); err != nil {
		t.Fatalf("expected COMPLIANT to pass, got %v", err)
	}

	if err := policy.ValidatePackageForDistribution("pkg-3", "REVIEW_REQUIRED"); !errors.Is(err, domain.ErrComplianceNotApproved) {
		t.Fatalf("expected ErrComplianceNotApproved for REVIEW_REQUIRED, got %v", err)
	}

	if err := policy.ValidatePackageForDistribution("pkg-4", "REJECTED"); !errors.Is(err, domain.ErrComplianceNotApproved) {
		t.Fatalf("expected ErrComplianceNotApproved for REJECTED, got %v", err)
	}
}

func TestGenerateDeliveryHash(t *testing.T) {
	ts := time.Now().Unix()
	h1 := domain.GenerateDeliveryHash("tenant-1", "job-1", "TWITTER", "DELIVERED", "SVC-071", ts)
	h2 := domain.GenerateDeliveryHash("tenant-1", "job-1", "TWITTER", "DELIVERED", "SVC-071", ts)
	if h1 != h2 || len(h1) != 64 {
		t.Fatalf("expected deterministic 64-char sha256 hex hash, got %s", h1)
	}
}
