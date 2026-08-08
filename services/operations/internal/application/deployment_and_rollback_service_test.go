package application_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/operations/internal/application"
	"github.com/agbofa/nexus/services/operations/internal/domain"
)

type inMemRollbackRepo struct {
	rollbacks []domain.RollbackRecord
}

func newInMemRollbackRepo() *inMemRollbackRepo {
	return &inMemRollbackRepo{}
}

func (r *inMemRollbackRepo) SaveRollback(rb domain.RollbackRecord) error {
	r.rollbacks = append(r.rollbacks, rb)
	return nil
}

func TestDeploymentAndRollbackService_Flow(t *testing.T) {
	candidates := newInMemCandidateRepo()
	deployments := newInMemDeploymentRepo()
	rollbacks := newInMemRollbackRepo()
	auditRepo := newInMemAuditRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewDeploymentAndRollbackService(candidates, deployments, rollbacks, auditRepo, pub, audit)

	cand := domain.ReleaseCandidateArtifact{
		CandidateID:          "rc-200",
		TenantID:             "tenant-1",
		Version:              "v1.1.0",
		ApprovedForPromotion: true,
	}
	_ = candidates.SaveCandidate(cand)

	if err := svc.PromoteEnvironment(context.Background(), "tenant-1", "rc-200", domain.EnvStaging, domain.EnvProduction); err != nil {
		t.Fatalf("expected promotion to succeed, got %v", err)
	}

	err := svc.PromoteEnvironment(context.Background(), "tenant-1", "rc-200", domain.EnvDevelopment, domain.EnvProduction)
	if !errors.Is(err, domain.ErrInvalidEnvironmentPath) {
		t.Fatalf("expected ErrInvalidEnvironmentPath, got %v", err)
	}

	dep := domain.DeploymentRecord{
		DeploymentID: "dep-old-1",
		TenantID:     "tenant-1",
		Version:      "v1.0.0",
		Status:       "DEPLOYED",
		DeployedAt:   time.Now(),
	}
	_ = deployments.SaveDeployment(dep)

	rb, err := svc.ExecuteRollback(context.Background(), "tenant-1", "dep-new-2", "dep-old-1", "critical regression")
	if err != nil || rb == nil {
		t.Fatalf("expected rollback executed, got err=%v", err)
	}
	if !rb.Executed || rb.TargetVersion != "v1.0.0" {
		t.Fatalf("expected target version v1.0.0, got %s", rb.TargetVersion)
	}
	if len(rollbacks.rollbacks) != 1 {
		t.Fatalf("expected 1 rollback saved")
	}
}
