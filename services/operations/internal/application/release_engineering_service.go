package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/operations/internal/domain"
)

type EventPublisher interface {
	PublishEvent(ctx context.Context, eventType, tenantID, source, payload string) error
}

type AuditLogger interface {
	LogEvent(ctx context.Context, tenantID, action, resource, details string) error
}

type ReleaseEngineeringService struct {
	candidates domain.ReleaseCandidateRepository
	deployments domain.DeploymentRepository
	auditRepo  domain.OperationalAuditRepository
	pub        EventPublisher
	audit      AuditLogger
	gatePolicy domain.ReleaseGatePolicy
	envPolicy  domain.EnvironmentPromotionPolicy
}

func NewReleaseEngineeringService(
	candidates domain.ReleaseCandidateRepository,
	deployments domain.DeploymentRepository,
	auditRepo domain.OperationalAuditRepository,
	pub EventPublisher,
	audit AuditLogger,
) *ReleaseEngineeringService {
	return &ReleaseEngineeringService{
		candidates:  candidates,
		deployments: deployments,
		auditRepo:   auditRepo,
		pub:         pub,
		audit:       audit,
		gatePolicy:  domain.ReleaseGatePolicy{},
		envPolicy:   domain.EnvironmentPromotionPolicy{},
	}
}

func (s *ReleaseEngineeringService) CreateReleaseCandidate(
	ctx context.Context,
	tenantID, version, commitSHA string,
	targetEnv domain.EnvironmentType,
) (*domain.ReleaseCandidateArtifact, error) {
	if tenantID == "" || version == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	ts := time.Now().Unix()
	hash := domain.GenerateOperationsHash(tenantID, version, "CREATE_RELEASE_CANDIDATE", commitSHA, ts)

	cand := domain.ReleaseCandidateArtifact{
		CandidateID:          fmt.Sprintf("rc-%d", time.Now().UnixNano()),
		TenantID:             tenantID,
		Version:              version,
		CommitSHA:            commitSHA,
		Environment:          targetEnv,
		GateEvaluations:      nil,
		ApprovedForPromotion: false,
		ProvenanceHash:       hash,
		CreatedAt:            time.Now(),
	}

	if err := s.candidates.SaveCandidate(cand); err != nil {
		return nil, err
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "operations.release.candidate_created", tenantID, "SVC-156", fmt.Sprintf("rc=%s ver=%s env=%s", cand.CandidateID, version, targetEnv))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "create_release_candidate", cand.CandidateID, fmt.Sprintf("version=%s sha=%s", version, commitSHA))
	}

	return &cand, nil
}

func (s *ReleaseEngineeringService) EvaluateReleaseGates(
	ctx context.Context,
	tenantID, candidateID string,
	evals []domain.ReleaseGateEvaluation,
) (bool, []string, error) {
	cand, err := s.candidates.GetCandidate(tenantID, candidateID)
	if err != nil {
		return false, nil, err
	}

	ok, failures := s.gatePolicy.EvaluatePromotionEligibility(evals)
	cand.GateEvaluations = evals
	cand.ApprovedForPromotion = ok
	if err := s.candidates.SaveCandidate(*cand); err != nil {
		return false, nil, err
	}

	ts := time.Now().Unix()
	hash := domain.GenerateOperationsHash(tenantID, candidateID, "EVALUATE_RELEASE_GATES", fmt.Sprintf("approved=%v", ok), ts)
	if s.auditRepo != nil {
		_ = s.auditRepo.AppendRecord(domain.OperationalAuditRecord{
			RecordID:          fmt.Sprintf("aud-gate-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			ResourceID:        candidateID,
			Action:            "EVALUATE_RELEASE_GATES",
			Actor:             "SVC-165",
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "operations.release.gate_evaluated", tenantID, "SVC-165", fmt.Sprintf("rc=%s approved=%v", candidateID, ok))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "evaluate_release_gates", candidateID, fmt.Sprintf("approved=%v failures=%v", ok, failures))
	}

	return ok, failures, nil
}

func (s *ReleaseEngineeringService) RecordDeployment(
	ctx context.Context,
	tenantID, candidateID, version, commitSHA string,
	env domain.EnvironmentType,
) (*domain.DeploymentRecord, error) {
	cand, err := s.candidates.GetCandidate(tenantID, candidateID)
	if err != nil {
		return nil, err
	}
	if !cand.ApprovedForPromotion {
		return nil, domain.ErrGateVerificationFailed
	}

	ts := time.Now().Unix()
	hash := domain.GenerateOperationsHash(tenantID, candidateID, "DEPLOYMENT_COMPLETED", string(env), ts)

	dep := domain.DeploymentRecord{
		DeploymentID:   fmt.Sprintf("dep-%d", time.Now().UnixNano()),
		TenantID:       tenantID,
		CandidateID:    candidateID,
		Environment:    env,
		Version:        version,
		Status:         "DEPLOYED",
		ProvenanceHash: hash,
		DeployedAt:     time.Now(),
	}

	if err := s.deployments.SaveDeployment(dep); err != nil {
		return nil, err
	}

	if s.auditRepo != nil {
		_ = s.auditRepo.AppendRecord(domain.OperationalAuditRecord{
			RecordID:          fmt.Sprintf("aud-dep-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			ResourceID:        dep.DeploymentID,
			Action:            "DEPLOYMENT_COMPLETED",
			Actor:             "SVC-166",
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "operations.deployment.completed", tenantID, "SVC-166", fmt.Sprintf("dep=%s ver=%s env=%s", dep.DeploymentID, version, env))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "record_deployment", dep.DeploymentID, fmt.Sprintf("version=%s env=%s", version, env))
	}

	return &dep, nil
}
