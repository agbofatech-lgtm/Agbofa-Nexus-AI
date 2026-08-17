package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/compliance/internal/application"
	"github.com/agbofa/nexus/services/compliance/internal/domain"
)

func TestComplianceWorkflow_WF022Execution(t *testing.T) {
	reports := newInMemReportRepo()
	reviews := newInMemReviewRepo()
	auditRepo := newInMemAuditRepo()
	pub := &mockPublisher{}

	orch := application.NewComplianceGatekeeperOrchestrator(
		reports,
		reviews,
		auditRepo,
		nil,
		nil,
		pub,
		nil,
	)

	wf, err := orch.ExecuteComplianceWorkflow(context.Background(), "tenant-1", "wf-compliance-main", nil)
	if err != nil || wf == nil {
		t.Fatalf("expected workflow execution to succeed, got err=%v", err)
	}
	if wf.WorkflowID != "WF-022" {
		t.Fatalf("expected WF-022, got %s", wf.WorkflowID)
	}

	_, err = orch.ExecuteComplianceWorkflow(context.Background(), "", "wf-no-tenant", nil)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for missing tenant, got %v", err)
	}
}
