package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/content-factory/internal/application"
	"github.com/agbofa/nexus/services/content-factory/internal/domain"
)

type inMemDecisionRepo struct {
	decisions map[string]domain.ReviewDecision
}

func newInMemDecisionRepo() *inMemDecisionRepo {
	return &inMemDecisionRepo{decisions: make(map[string]domain.ReviewDecision)}
}

func (r *inMemDecisionRepo) SaveDecision(d domain.ReviewDecision) error {
	r.decisions[d.TenantID+":"+d.PackageID] = d
	return nil
}

func (r *inMemDecisionRepo) GetDecisionByPackage(tenantID, packageID string) (*domain.ReviewDecision, error) {
	d, ok := r.decisions[tenantID+":"+packageID]
	if !ok {
		return nil, domain.ErrReviewDecisionNotFound
	}
	return &d, nil
}

func TestContentFactoryOrchestrator_EVT024IdempotencyAndFlow(t *testing.T) {
	packages := newInMemPackageRepo()
	voices := newInMemVoiceRepo()
	decisions := newInMemDecisionRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	intelSvc := application.NewStoryIntelligenceService(packages, voices, pub, audit)
	genSvc := application.NewEditorialGenerationService(packages, nil, audit)
	adaptSvc := application.NewAdaptationService(packages, nil, pub, audit)

	orch := application.NewContentFactoryOrchestrator(
		packages,
		decisions,
		intelSvc,
		genSvc,
		adaptSvc,
		nil,
		pub,
		audit,
	)

	pkg1, err := orch.HandleStoryVerifiedEvent(
		context.Background(),
		"evt-024-100",
		"tenant-1",
		"story-700",
		"AI Revolution Title",
		"Summary of verified truth story...",
		"",
		[]string{"TWITTER"},
	)
	if err != nil || pkg1 == nil {
		t.Fatalf("expected package generated from verified story, got err=%v", err)
	}

	pkg2, err := orch.HandleStoryVerifiedEvent(
		context.Background(),
		"evt-024-100",
		"tenant-1",
		"story-700",
		"AI Revolution Title",
		"Summary of verified truth story...",
		"",
		[]string{"TWITTER"},
	)
	if err != nil || pkg2 != nil {
		t.Fatalf("expected nil package on idempotent duplicate event, got %v err=%v", pkg2, err)
	}

	qa, err := orch.ExecuteQualityAssurance(context.Background(), "tenant-1", pkg1.PackageID)
	if err != nil || !qa.Passed {
		t.Fatalf("expected QA passed, got err=%v qa=%v", err, qa)
	}

	updatedPkg, _ := packages.GetPackage("tenant-1", pkg1.PackageID)
	if updatedPkg.Status != domain.PackageStatusQAPassed {
		t.Fatalf("expected QA_PASSED status, got %s", updatedPkg.Status)
	}

	_, err = orch.SubmitForHumanReview(context.Background(), "tenant-1", pkg1.PackageID)
	if err != nil {
		t.Fatalf("unexpected error submitting for review: %v", err)
	}

	dec, err := orch.ReviewPackage(context.Background(), "tenant-1", pkg1.PackageID, "editor-01", true, "LGTM")
	if err != nil || !dec.Approved {
		t.Fatalf("expected review approved, got err=%v", err)
	}

	finalPkg, _ := packages.GetPackage("tenant-1", pkg1.PackageID)
	if finalPkg.Status != domain.PackageStatusApproved {
		t.Fatalf("expected APPROVED status, got %s", finalPkg.Status)
	}

	_, err = orch.ReviewPackage(context.Background(), "tenant-1", pkg1.PackageID, "editor-02", false, "late reject")
	if !errors.Is(err, domain.ErrInvalidPackageTransition) {
		t.Fatalf("expected ErrInvalidPackageTransition, got %v", err)
	}
}
