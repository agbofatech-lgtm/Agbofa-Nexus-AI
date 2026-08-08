package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/operations/internal/application"
	"github.com/agbofa/nexus/services/operations/internal/domain"
)

func TestOperationsOrchestrator_Workflows(t *testing.T) {
	candidates := newInMemCandidateRepo()
	deployments := newInMemDeploymentRepo()
	rollbacks := newInMemRollbackRepo()
	backups := newInMemBackupRepo()
	auditRepo := newInMemAuditRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	relSvc := application.NewReleaseEngineeringService(candidates, deployments, auditRepo, pub, audit)
	depSvc := application.NewDeploymentAndRollbackService(candidates, deployments, rollbacks, auditRepo, pub, audit)
	healthSvc := application.NewOperationsHealthAndDRService(backups, auditRepo, pub, audit)

	orch := application.NewOperationsOrchestrator(relSvc, depSvc, healthSvc, auditRepo, pub, audit)

	wf25, err := orch.ExecuteProductionReadinessWorkflow(context.Background(), "tenant-1", "rc-300")
	if err != nil || wf25 == nil {
		t.Fatalf("expected WF-025 to complete, got err=%v", err)
	}
	if wf25.WorkflowID != "WF-025" {
		t.Fatalf("expected WF-025, got %s", wf25.WorkflowID)
	}

	wf36, err := orch.ExecuteInfrastructureDeliveryWorkflow(context.Background(), "tenant-1", "rc-300", domain.EnvStaging)
	if err != nil || wf36 == nil {
		t.Fatalf("expected WF-036 to complete, got err=%v", err)
	}
	if wf36.WorkflowID != "WF-036" {
		t.Fatalf("expected WF-036, got %s", wf36.WorkflowID)
	}

	wf35, err := orch.ExecuteAutonomousRuntimeWorkflow(context.Background(), "tenant-1", "WF-035-main", nil)
	if err != nil || wf35 == nil {
		t.Fatalf("expected WF-035 to complete, got err=%v", err)
	}

	_, err = orch.ExecuteProductionReadinessWorkflow(context.Background(), "", "rc-1")
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenant, got %v", err)
	}
}
