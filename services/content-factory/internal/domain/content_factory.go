package domain

import (
	"errors"
	"fmt"
)

var (
	ErrPackageNotFound         = errors.New("content package not found")
	ErrBrandVoiceNotFound      = errors.New("brand voice profile not found")
	ErrReviewDecisionNotFound  = errors.New("review decision not found")
	ErrInvalidPackageTransition = errors.New("invalid content package state transition")
	ErrCrossTenantViolation    = errors.New("prohibited cross-tenant package access or mutation")
	ErrDownstreamBoundary      = errors.New("prohibited cross-boundary operation")
)

type ContentPackageRepository interface {
	SavePackage(pkg ContentPackage) error
	GetPackage(tenantID, packageID string) (*ContentPackage, error)
	ListPackages(tenantID, statusFilter string) ([]ContentPackage, error)
}

type BrandVoiceRepository interface {
	SaveProfile(p BrandVoiceProfile) error
	GetProfile(tenantID, profileID string) (*BrandVoiceProfile, error)
}

type ReviewDecisionRepository interface {
	SaveDecision(d ReviewDecision) error
	GetDecisionByPackage(tenantID, packageID string) (*ReviewDecision, error)
}

type PackageStatePolicy struct{}

func (p PackageStatePolicy) ValidateTransition(from, to PackageStatus) error {
	if from == to {
		return nil
	}
	if to == PackageStatusRejected {
		return nil
	}

	valid := map[PackageStatus]map[PackageStatus]bool{
		PackageStatusDraft: {
			PackageStatusQAPassed:       true,
			PackageStatusReviewRequired: true,
		},
		PackageStatusQAPassed: {
			PackageStatusReviewRequired: true,
			PackageStatusApproved:       true,
		},
		PackageStatusReviewRequired: {
			PackageStatusApproved: true,
		},
	}

	allowed, exists := valid[from][to]
	if !exists || !allowed {
		return fmt.Errorf("%w: cannot transition from %s to %s", ErrInvalidPackageTransition, from, to)
	}
	return nil
}

type QAQualityPolicy struct{}

func (p QAQualityPolicy) ValidateQAScore(score, threshold float64, issues []string) (bool, PackageStatus) {
	if score >= threshold && len(issues) == 0 {
		return true, PackageStatusQAPassed
	}
	if score >= 0.70 {
		return false, PackageStatusReviewRequired
	}
	return false, PackageStatusRejected
}

func ValidateTenantIsolation(tenantID, targetTenantID string) error {
	if tenantID == "" || targetTenantID == "" || tenantID != targetTenantID {
		return fmt.Errorf("%w: caller tenant %s cannot access target tenant %s", ErrCrossTenantViolation, tenantID, targetTenantID)
	}
	return nil
}
