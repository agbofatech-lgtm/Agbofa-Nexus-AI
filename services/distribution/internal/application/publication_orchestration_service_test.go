package application_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/distribution/internal/application"
	"github.com/agbofa/nexus/services/distribution/internal/domain"
)

type inMemJobRepo struct {
	jobs map[string]domain.PublicationJob
}

func newInMemJobRepo() *inMemJobRepo {
	return &inMemJobRepo{jobs: make(map[string]domain.PublicationJob)}
}

func (r *inMemJobRepo) SaveJob(job domain.PublicationJob) error {
	r.jobs[job.TenantID+":"+job.PublicationJobID] = job
	return nil
}

func (r *inMemJobRepo) GetJob(tenantID, jobID string) (*domain.PublicationJob, error) {
	job, ok := r.jobs[tenantID+":"+jobID]
	if !ok {
		return nil, domain.ErrJobNotFound
	}
	return &job, nil
}

func (r *inMemJobRepo) GetJobByPackage(tenantID, packageID string) (*domain.PublicationJob, error) {
	for _, job := range r.jobs {
		if job.TenantID == tenantID && job.PackageID == packageID {
			return &job, nil
		}
	}
	return nil, domain.ErrJobNotFound
}

func (r *inMemJobRepo) ListJobs(tenantID, statusFilter string) ([]domain.PublicationJob, error) {
	var out []domain.PublicationJob
	for _, job := range r.jobs {
		if job.TenantID == tenantID {
			if statusFilter == "" || string(job.Status) == statusFilter {
				out = append(out, job)
			}
		}
	}
	return out, nil
}

type inMemDeliveryAuditRepo struct {
	records []domain.DeliveryAuditRecord
}

func newInMemDeliveryAuditRepo() *inMemDeliveryAuditRepo {
	return &inMemDeliveryAuditRepo{}
}

func (r *inMemDeliveryAuditRepo) AppendRecord(rec domain.DeliveryAuditRecord) error {
	r.records = append(r.records, rec)
	return nil
}

func (r *inMemDeliveryAuditRepo) GetAuditTrail(tenantID, jobID string) ([]domain.DeliveryAuditRecord, error) {
	var out []domain.DeliveryAuditRecord
	for _, rec := range r.records {
		if rec.TenantID == tenantID && (rec.PublicationJobID == jobID || rec.PublicationJobID == "all") {
			out = append(out, rec)
		}
	}
	return out, nil
}

type mockPublisher struct {
	events []string
}

func (m *mockPublisher) PublishEvent(ctx context.Context, eventType, tenantID, source, payload string) error {
	m.events = append(m.events, eventType+":"+payload)
	return nil
}

type mockAudit struct {
	logs []string
}

func (m *mockAudit) LogEvent(ctx context.Context, tenantID, action, resource, details string) error {
	m.logs = append(m.logs, action+":"+resource)
	return nil
}

type mockLLMProvider struct {
	id      string
	name    string
	content string
}

func (m *mockLLMProvider) ID() string   { return m.id }
func (m *mockLLMProvider) Name() string { return m.name }
func (m *mockLLMProvider) Generate(ctx context.Context, req llm.CompletionRequest) (llm.CompletionResponse, error) {
	return llm.CompletionResponse{
		ProviderID:  m.id,
		Model:       req.Model,
		Content:     m.content,
		TotalTokens: 25,
		Latency:     10 * time.Millisecond,
	}, nil
}

func TestPublicationOrchestrationService_ComplianceBoundaryAndDelivery(t *testing.T) {
	jobs := newInMemJobRepo()
	auditRepo := newInMemDeliveryAuditRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewPublicationOrchestrationService(jobs, auditRepo, nil, pub, audit)

	_, err := svc.SchedulePublication(
		context.Background(),
		"tenant-1",
		"pkg-unapproved",
		"story-10",
		"Title",
		"REVIEW_REQUIRED",
		[]string{"TWITTER"},
		0,
	)
	if !errors.Is(err, domain.ErrComplianceNotApproved) {
		t.Fatalf("expected ErrComplianceNotApproved for REVIEW_REQUIRED package, got %v", err)
	}

	job, err := svc.SchedulePublication(
		context.Background(),
		"tenant-1",
		"pkg-approved",
		"story-10",
		"Title",
		"APPROVED",
		[]string{"TWITTER", "LINKEDIN"},
		0,
	)
	if err != nil || job == nil {
		t.Fatalf("expected schedule to succeed for APPROVED package, got err=%v", err)
	}
	if job.Status != domain.DeliveryStatusScheduled {
		t.Fatalf("expected SCHEDULED, got %s", job.Status)
	}

	delivered, err := svc.DeliverJob(context.Background(), "tenant-1", job.PublicationJobID)
	if err != nil || delivered == nil {
		t.Fatalf("expected delivery to succeed, got err=%v", err)
	}
	if delivered.Status != domain.DeliveryStatusDelivered {
		t.Fatalf("expected DELIVERED status, got %s", delivered.Status)
	}
	if len(pub.events) < 2 {
		t.Fatalf("expected submitted and success events emitted, got %d", len(pub.events))
	}
}
