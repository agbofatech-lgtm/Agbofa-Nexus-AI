package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/compliance/internal/application"
	"github.com/agbofa/nexus/services/compliance/internal/domain"
)

type inMemReportRepo struct {
	reports map[string]domain.ComplianceReport
}

func newInMemReportRepo() *inMemReportRepo {
	return &inMemReportRepo{reports: make(map[string]domain.ComplianceReport)}
}

func (r *inMemReportRepo) SaveReport(rep domain.ComplianceReport) error {
	r.reports[rep.TenantID+":"+rep.ReportID] = rep
	return nil
}

func (r *inMemReportRepo) GetReport(tenantID, reportID string) (*domain.ComplianceReport, error) {
	rep, ok := r.reports[tenantID+":"+reportID]
	if !ok {
		return nil, domain.ErrReportNotFound
	}
	return &rep, nil
}

func (r *inMemReportRepo) GetReportByPackage(tenantID, packageID string) (*domain.ComplianceReport, error) {
	for _, rep := range r.reports {
		if rep.TenantID == tenantID && rep.PackageID == packageID {
			return &rep, nil
		}
	}
	return nil, domain.ErrReportNotFound
}

func (r *inMemReportRepo) ListReports(tenantID, statusFilter string) ([]domain.ComplianceReport, error) {
	var out []domain.ComplianceReport
	for _, rep := range r.reports {
		if rep.TenantID == tenantID {
			if statusFilter == "" || string(rep.Status) == statusFilter {
				out = append(out, rep)
			}
		}
	}
	return out, nil
}

type inMemReviewRepo struct {
	reviews map[string]domain.ComplianceReviewDecision
}

func newInMemReviewRepo() *inMemReviewRepo {
	return &inMemReviewRepo{reviews: make(map[string]domain.ComplianceReviewDecision)}
}

func (r *inMemReviewRepo) SaveDecision(d domain.ComplianceReviewDecision) error {
	r.reviews[d.TenantID+":"+d.ReportID] = d
	return nil
}

func (r *inMemReviewRepo) GetDecisionByReport(tenantID, reportID string) (*domain.ComplianceReviewDecision, error) {
	d, ok := r.reviews[tenantID+":"+reportID]
	if !ok {
		return nil, domain.ErrReviewNotFound
	}
	return &d, nil
}

func TestComplianceGatekeeperOrchestrator_Flow(t *testing.T) {
	reports := newInMemReportRepo()
	reviews := newInMemReviewRepo()
	auditRepo := newInMemAuditRepo()
	pub := &mockPublisher{}

	rightsSvc := application.NewRightsOriginalityLegalService(auditRepo, nil, pub, nil)
	privacySvc := application.NewPrivacySafetyPolicyService(auditRepo, nil, nil)

	orch := application.NewComplianceGatekeeperOrchestrator(
		reports,
		reviews,
		auditRepo,
		rightsSvc,
		privacySvc,
		pub,
		nil,
	)

	rep, err := orch.EvaluatePackageCompliance(
		context.Background(),
		"tenant-1",
		"pkg-300",
		"story-100",
		"Clean Article Title",
		"Clean body text...",
		[]string{"TWITTER"},
		false,
	)
	if err != nil || rep == nil {
		t.Fatalf("expected package evaluation to succeed, got err=%v", err)
	}
	if rep.Status != domain.ComplianceStatusCompliant {
		t.Fatalf("expected COMPLIANT status, got %s", rep.Status)
	}

	repPII, _ := orch.EvaluatePackageCompliance(
		context.Background(),
		"tenant-1",
		"pkg-301",
		"story-101",
		"PII Title",
		"Text containing SSN: 000-00-0000",
		[]string{"TWITTER"},
		false,
	)
	if repPII.Status != domain.ComplianceStatusRejected {
		t.Fatalf("expected REJECTED status on PII, got %s", repPII.Status)
	}

	err = orch.HandleMisinfoDetectedEvent(context.Background(), "evt-025-01", "tenant-1", "story-100", rep.ReportID)
	if err != nil {
		t.Fatalf("unexpected error consuming EVT-025: %v", err)
	}

	_ = orch.HandleMisinfoDetectedEvent(context.Background(), "evt-025-01", "tenant-1", "story-100", rep.ReportID)

	_, err = orch.SubmitReviewDecision(context.Background(), "tenant-1", repPII.ReportID, "officer-1", true, "cannot approve rejected")
	if !errors.Is(err, domain.ErrInvalidComplianceTransition) {
		t.Fatalf("expected ErrInvalidComplianceTransition out of REJECTED, got %v", err)
	}
}
