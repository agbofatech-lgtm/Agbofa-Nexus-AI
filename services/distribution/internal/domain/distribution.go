package domain

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
)

var (
	ErrJobNotFound             = errors.New("publication job not found")
	ErrAlertNotFound           = errors.New("breaking news alert not found")
	ErrCorrectionNotFound      = errors.New("correction record not found")
	ErrRetractionNotFound      = errors.New("retraction record not found")
	ErrInvalidDeliveryTransition = errors.New("invalid distribution delivery state transition")
	ErrCrossTenantViolation    = errors.New("prohibited cross-tenant distribution access or mutation")
	ErrComplianceNotApproved   = errors.New("content package rejected or not approved by compliance gatekeeper")
	ErrDownstreamBoundary      = errors.New("prohibited cross-boundary operation")
)

type PublicationJobRepository interface {
	SaveJob(job PublicationJob) error
	GetJob(tenantID, jobID string) (*PublicationJob, error)
	GetJobByPackage(tenantID, packageID string) (*PublicationJob, error)
	ListJobs(tenantID, statusFilter string) ([]PublicationJob, error)
}

type BreakingNewsRepository interface {
	SaveAlert(alert BreakingNewsAlert) error
	GetAlert(tenantID, alertID string) (*BreakingNewsAlert, error)
}

type CorrectionRetractionRepository interface {
	SaveCorrection(c CorrectionRecord) error
	SaveRetraction(r RetractionRecord) error
	ListCorrectionsByJob(tenantID, jobID string) ([]CorrectionRecord, error)
	GetRetractionByJob(tenantID, jobID string) (*RetractionRecord, error)
}

type DeliveryAuditRepository interface {
	AppendRecord(rec DeliveryAuditRecord) error
	GetAuditTrail(tenantID, jobID string) ([]DeliveryAuditRecord, error)
}

type DeliveryStatePolicy struct{}

func (p DeliveryStatePolicy) ValidateTransition(from, to DeliveryStatus) error {
	if from == to {
		return nil
	}
	if to == DeliveryStatusRetracted {
		return nil
	}

	valid := map[DeliveryStatus]map[DeliveryStatus]bool{
		DeliveryStatusScheduled: {
			DeliveryStatusDelivering: true,
			DeliveryStatusFailed:     true,
		},
		DeliveryStatusDelivering: {
			DeliveryStatusDelivered: true,
			DeliveryStatusFailed:    true,
			DeliveryStatusRetrying:  true,
		},
		DeliveryStatusRetrying: {
			DeliveryStatusDelivering: true,
			DeliveryStatusFailed:     true,
		},
		DeliveryStatusDelivered: {
			DeliveryStatusCorrected: true,
		},
		DeliveryStatusCorrected: {
			DeliveryStatusCorrected: true,
		},
	}

	allowed, exists := valid[from][to]
	if !exists || !allowed {
		return fmt.Errorf("%w: cannot transition from %s to %s", ErrInvalidDeliveryTransition, from, to)
	}
	return nil
}

type ComplianceBoundaryPolicy struct{}

func (p ComplianceBoundaryPolicy) ValidatePackageForDistribution(packageID, complianceStatus string) error {
	if complianceStatus == "COMPLIANT" || complianceStatus == "APPROVED" || complianceStatus == "QA_PASSED" {
		return nil
	}
	return fmt.Errorf("%w: package %s has compliance status '%s', distribution prohibited", ErrComplianceNotApproved, packageID, complianceStatus)
}

func GenerateDeliveryHash(tenantID, jobID, channel, eventType, actor string, ts int64) string {
	raw := fmt.Sprintf("%s:%s:%s:%s:%s:%d", tenantID, jobID, channel, eventType, actor, ts)
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}

func ValidateTenantIsolation(tenantID, targetTenantID string) error {
	if tenantID == "" || targetTenantID == "" || tenantID != targetTenantID {
		return fmt.Errorf("%w: caller tenant %s cannot access target tenant %s", ErrCrossTenantViolation, tenantID, targetTenantID)
	}
	return nil
}
