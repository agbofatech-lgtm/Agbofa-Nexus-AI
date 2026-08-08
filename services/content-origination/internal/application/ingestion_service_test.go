package application_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/content-origination/internal/application"
	"github.com/agbofa/nexus/services/content-origination/internal/domain"
)

type inMemSourceRepo struct {
	sources map[string]domain.SourceEntity
}

func newInMemSourceRepo() *inMemSourceRepo {
	return &inMemSourceRepo{sources: make(map[string]domain.SourceEntity)}
}

func (r *inMemSourceRepo) SaveSource(src domain.SourceEntity) error {
	r.sources[src.SourceID] = src
	return nil
}

func (r *inMemSourceRepo) FindSource(id string) (*domain.SourceEntity, error) {
	s, ok := r.sources[id]
	if !ok {
		return nil, domain.ErrSourceNotFound
	}
	return &s, nil
}

func (r *inMemSourceRepo) ListSources(tenantID string, activeOnly bool) ([]domain.SourceEntity, error) {
	var list []domain.SourceEntity
	for _, s := range r.sources {
		if s.TenantID != tenantID {
			continue
		}
		if activeOnly && !s.Active {
			continue
		}
		list = append(list, s)
	}
	return list, nil
}

type inMemIngestRepo struct {
	jobs map[string]domain.IngestJob
}

func newInMemIngestRepo() *inMemIngestRepo {
	return &inMemIngestRepo{jobs: make(map[string]domain.IngestJob)}
}

func (r *inMemIngestRepo) SaveIngestJob(job domain.IngestJob) error {
	r.jobs[job.IngestJobID] = job
	return nil
}

func (r *inMemIngestRepo) GetIngestJob(id string) (*domain.IngestJob, error) {
	job, ok := r.jobs[id]
	if !ok {
		return nil, domain.ErrIngestJobNotFound
	}
	return &job, nil
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

func TestIngestionService_Flow(t *testing.T) {
	sources := newInMemSourceRepo()
	ingest := newInMemIngestRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewIngestionService(sources, ingest, pub, audit)

	src := domain.SourceEntity{
		SourceID:         "src-01",
		TenantID:         "tenant-1",
		Name:             "Tech RSS Feed",
		SourceType:       domain.SourceTypeRSS,
		ReliabilityScore: 0.95,
		Active:           true,
		CreatedAt:        time.Now(),
	}
	if err := svc.RegisterSource(context.Background(), src); err != nil {
		t.Fatalf("failed to register source: %v", err)
	}

	job, err := svc.IngestSourceDocument(
		context.Background(),
		"tenant-1",
		"src-01",
		domain.SourceTypeRSS,
		"  Breakthrough in AI Media Origination   \r\n\r\nSecond line ",
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if job.NormalizedText != "Breakthrough in AI Media Origination   \n\nSecond line" {
		t.Fatalf("unexpected normalized text: %q", job.NormalizedText)
	}
	if len(pub.events) == 0 {
		t.Fatalf("expected ingestion event published")
	}
}

func TestIngestionService_InactiveSource(t *testing.T) {
	sources := newInMemSourceRepo()
	ingest := newInMemIngestRepo()
	svc := application.NewIngestionService(sources, ingest, nil, nil)

	src := domain.SourceEntity{
		SourceID: "src-02",
		TenantID: "tenant-1",
		Name:     "Inactive Feed",
		Active:   false,
	}
	_ = svc.RegisterSource(context.Background(), src)

	_, err := svc.IngestSourceDocument(context.Background(), "tenant-1", "src-02", domain.SourceTypeRSS, "test")
	if !errors.Is(err, domain.ErrSourceInactive) {
		t.Fatalf("expected ErrSourceInactive, got %v", err)
	}
}
