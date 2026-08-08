package domain

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
)

var (
	ErrCandidateNotFound     = errors.New("release candidate not found")
	ErrDeploymentNotFound    = errors.New("deployment record not found")
	ErrBackupNotFound        = errors.New("disaster recovery backup verification not found")
	ErrGateVerificationFailed = errors.New("mandatory release quality gate failed or missing evidence")
	ErrInvalidEnvironmentPath = errors.New("invalid environment promotion path")
	ErrCrossTenantViolation  = errors.New("prohibited cross-tenant operational access or mutation")
	ErrDownstreamBoundary    = errors.New("prohibited cross-boundary operation")
)

type ReleaseCandidateRepository interface {
	SaveCandidate(c ReleaseCandidateArtifact) error
	GetCandidate(tenantID, candidateID string) (*ReleaseCandidateArtifact, error)
}

type DeploymentRepository interface {
	SaveDeployment(d DeploymentRecord) error
	GetDeployment(tenantID, deploymentID string) (*DeploymentRecord, error)
}

type RollbackRepository interface {
	SaveRollback(r RollbackRecord) error
}

type DRBackupRepository interface {
	SaveBackupVerification(b DRBackupVerification) error
	GetBackupVerification(tenantID, backupID string) (*DRBackupVerification, error)
}

type OperationalAuditRepository interface {
	AppendRecord(rec OperationalAuditRecord) error
	GetAuditTrail(tenantID, resourceID string) ([]OperationalAuditRecord, error)
}

type ReleaseGatePolicy struct{}

func (p ReleaseGatePolicy) EvaluatePromotionEligibility(evals []ReleaseGateEvaluation) (bool, []string) {
	requiredGates := []ReleaseGateName{
		GateCodeQuality,
		GateTests,
		GateBuild,
		GateDependencyValidation,
		GateSecurity,
		GateMigrations,
		GateGovernance,
	}

	evalMap := make(map[ReleaseGateName]ReleaseGateEvaluation)
	for _, e := range evals {
		evalMap[e.GateName] = e
	}

	var failures []string
	for _, req := range requiredGates {
		e, exists := evalMap[req]
		if !exists {
			failures = append(failures, fmt.Sprintf("missing_gate_%s", req))
		} else if e.Status != GateStatusPass {
			failures = append(failures, fmt.Sprintf("failed_gate_%s", req))
		} else if e.EvidenceRef == "" {
			failures = append(failures, fmt.Sprintf("missing_evidence_%s", req))
		}
	}

	return len(failures) == 0, failures
}

type EnvironmentPromotionPolicy struct{}

func (p EnvironmentPromotionPolicy) ValidatePromotionPath(from, to EnvironmentType) error {
	valid := map[EnvironmentType]map[EnvironmentType]bool{
		EnvDevelopment: {
			EnvTestValidation: true,
		},
		EnvTestValidation: {
			EnvStaging: true,
		},
		EnvStaging: {
			EnvProduction: true,
		},
	}

	allowed, exists := valid[from][to]
	if !exists || !allowed {
		return fmt.Errorf("%w: cannot promote from %s directly to %s", ErrInvalidEnvironmentPath, from, to)
	}
	return nil
}

func GenerateOperationsHash(tenantID, resourceID, action, actor string, ts int64) string {
	raw := fmt.Sprintf("%s:%s:%s:%s:%d", tenantID, resourceID, action, actor, ts)
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}

func ValidateTenantIsolation(tenantID, targetTenantID string) error {
	if tenantID == "" || targetTenantID == "" || tenantID != targetTenantID {
		return fmt.Errorf("%w: caller tenant %s cannot access target tenant %s", ErrCrossTenantViolation, tenantID, targetTenantID)
	}
	return nil
}
