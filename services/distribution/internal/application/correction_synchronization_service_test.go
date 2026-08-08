package application_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/distribution/internal/application"
	"github.com/agbofa/nexus/services/distribution/internal/domain"
)

type inMemCorrectionRepo struct {
	corrections []domain.CorrectionRecord
	retractions []domain.RetractionRecord
}

func newInMemCorrectionRepo() *inMemCorrectionRepo {
	return &inMemCorrectionRepo{}
}

func (r *inMemCorrectionRepo) SaveCorrection(c domain.CorrectionRecord) error {
	r.corrections = append(r.corrections, c)
	return nil
}

func (r *inMemCorrectionRepo) SaveRetraction(ret domain.RetractionRecord) error {
	r.retractions = append(r.retractions, ret)
	return nil
}

func (r *inMemCorrectionRepo) ListCorrectionsByJob(tenantID, jobID string) ([]domain.CorrectionRecord, error) {
	var out []domain.CorrectionRecord
	for _, c := range r.corrections {
		if c.TenantID == tenantID && c.PublicationJobID == jobID {
			out = append(out, c)
		}
	}
	return out, nil
}

func (r *inMemCorrectionRepo) GetRetractionByJob(tenantID, jobID string) (*domain.RetractionRecord, error) {
	for _, ret := range r.retractions {
		if ret.TenantID == tenantID && ret.PublicationJobID == jobID {
			return &ret, nil
		}
	}
	return nil, domain.ErrRetractionNotFound
}

func TestCorrectionSynchronizationService_Flow(t *testing.T) {
	jobs := newInMemJobRepo()
	corrRepo := newInMemCorrectionRepo()
	auditRepo := newInMemDeliveryAuditRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewCorrectionSynchronizationService(jobs, corrRepo, auditRepo, pub, audit)

	job := domain.PublicationJob{
		PublicationJobID: "job-del-1",
		TenantID:         "tenant-1",
		Title:            "Published Article",
		Status:           domain.DeliveryStatusDelivered,
		PublishedAt:      time.Now(),
	}
	_ = jobs.SaveJob(job)

	corr, err := svc.IssueCorrection(context.Background(), "tenant-1", "job-del-1", "Corrected body", "fixed typo")
	if err != nil || corr == nil {
		t.Fatalf("expected correction issued, got err=%v", err)
	}
	if len(corrRepo.corrections) != 1 {
		t.Fatalf("expected 1 correction record saved")
	}

	ret, err := svc.IssueRetraction(context.Background(), "tenant-1", "job-del-1", "source retraction")
	if err != nil || ret == nil {
		t.Fatalf("expected retraction issued, got err=%v", err)
	}

	_, err = svc.IssueCorrection(context.Background(), "tenant-1", "job-del-1", "test", "test")
	if !errors.Is(err, domain.ErrInvalidDeliveryTransition) {
		t.Fatalf("expected ErrInvalidDeliveryTransition out of RETRACTED, got %v", err)
	}
}
