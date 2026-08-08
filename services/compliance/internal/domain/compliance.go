package domain

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
)

var (
	ErrReportNotFound           = errors.New("compliance report not found")
	ErrReviewNotFound           = errors.New("compliance review decision not found")
	ErrInvalidComplianceTransition = errors.New("invalid compliance state transition")
	ErrCrossTenantViolation     = errors.New("prohibited cross-tenant compliance access or mutation")
	ErrComplianceRejected       = errors.New("content package rejected by compliance gatekeeper")
	ErrDownstreamBoundary       = errors.New("prohibited cross-boundary operation")
)

type ComplianceReportRepository interface {
	SaveReport(rep ComplianceReport) error
	GetReport(tenantID, reportID string) (*ComplianceReport, error)
	GetReportByPackage(tenantID, packageID string) (*ComplianceReport, error)
	ListReports(tenantID, statusFilter string) ([]ComplianceReport, error)
}

type ComplianceReviewRepository interface {
	SaveDecision(dec ComplianceReviewDecision) error
	GetDecisionByReport(tenantID, reportID string) (*ComplianceReviewDecision, error)
}

type ComplianceAuditRepository interface {
	AppendRecord(rec ComplianceAuditRecord) error
	GetAuditTrail(tenantID, packageID string) ([]ComplianceAuditRecord, error)
}

type ComplianceStatePolicy struct{}

func (p ComplianceStatePolicy) ValidateTransition(from, to ComplianceStatus) error {
	if from == to {
		return nil
	}
	if to == ComplianceStatusRejected {
		return nil
	}
	if from == ComplianceStatusRejected {
		return fmt.Errorf("%w: cannot transition out of REJECTED status", ErrInvalidComplianceTransition)
	}

	valid := map[ComplianceStatus]map[ComplianceStatus]bool{
		ComplianceStatusCompliant: {
			ComplianceStatusReviewRequired: true,
		},
		ComplianceStatusReviewRequired: {
			ComplianceStatusCompliant: true,
		},
	}

	allowed, exists := valid[from][to]
	if !exists || !allowed {
		return fmt.Errorf("%w: cannot transition from %s to %s", ErrInvalidComplianceTransition, from, to)
	}
	return nil
}

type ComplianceScoringPolicy struct{}

func (p ComplianceScoringPolicy) EvaluateOverallCompliance(
	rights RightsResult,
	orig OriginalityResult,
	legal LegalResult,
	priv PrivacyResult,
	safe AISafetyResult,
	pol PlatformPolicyResult,
) (float64, ComplianceStatus, []string) {
	var violations []string

	if !rights.Passed {
		violations = append(violations, "rights_management_failed")
	}
	if !orig.Passed {
		violations = append(violations, "plagiarism_threshold_exceeded")
	}
	if !legal.Passed {
		violations = append(violations, "legal_regulatory_risk_detected")
	}
	if !priv.Passed || priv.PIIDetected {
		violations = append(violations, "pii_privacy_violation_detected")
	}
	if !safe.Passed || safe.MisinfoFlagInherited {
		violations = append(violations, "ai_safety_misinformation_flagged")
	}
	if !pol.Passed {
		violations = append(violations, "platform_channel_policy_violation")
	}

	score := (rights.Score*0.15 + orig.Score*0.20 + legal.Score*0.20 + priv.Score*0.15 + safe.Score*0.20 + pol.Score*0.10)

	if safe.MisinfoFlagInherited || priv.PIIDetected || orig.MaxSimilarityPercent > 30.0 {
		return 0.20, ComplianceStatusRejected, violations
	}
	if len(violations) > 0 || score < 0.70 {
		return score, ComplianceStatusRejected, violations
	}
	if score >= 0.85 && len(violations) == 0 {
		return score, ComplianceStatusCompliant, nil
	}
	return score, ComplianceStatusReviewRequired, violations
}

func GenerateComplianceHash(tenantID, packageID, checkType, status, actor string, ts int64) string {
	raw := fmt.Sprintf("%s:%s:%s:%s:%s:%d", tenantID, packageID, checkType, status, actor, ts)
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}

func ValidateTenantIsolation(tenantID, targetTenantID string) error {
	if tenantID == "" || targetTenantID == "" || tenantID != targetTenantID {
		return fmt.Errorf("%w: caller tenant %s cannot access target tenant %s", ErrCrossTenantViolation, tenantID, targetTenantID)
	}
	return nil
}
