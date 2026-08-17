package application

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/agbofa/nexus/services/content-origination/internal/domain"
)

type EventPublisher interface {
	PublishEvent(ctx context.Context, eventType, tenantID, source, payload string) error
}

type AuditLogger interface {
	LogEvent(ctx context.Context, tenantID, action, resource, details string) error
}

type IngestionService struct {
	sources domain.SourceRepo
	ingest  domain.IngestRepo
	pub     EventPublisher
	audit   AuditLogger
}

func NewIngestionService(
	sources domain.SourceRepo,
	ingest domain.IngestRepo,
	pub EventPublisher,
	audit AuditLogger,
) *IngestionService {
	return &IngestionService{
		sources: sources,
		ingest:  ingest,
		pub:     pub,
		audit:   audit,
	}
}

func (s *IngestionService) RegisterSource(ctx context.Context, src domain.SourceEntity) error {
	if src.CreatedAt.IsZero() {
		src.CreatedAt = time.Now()
	}
	if err := s.sources.SaveSource(src); err != nil {
		return err
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, src.TenantID, "register_source", src.SourceID, src.Name)
	}
	return nil
}

func (s *IngestionService) ListSources(ctx context.Context, tenantID string, activeOnly bool) ([]domain.SourceEntity, error) {
	return s.sources.ListSources(tenantID, activeOnly)
}

func (s *IngestionService) IngestSourceDocument(
	ctx context.Context,
	tenantID, sourceID string,
	sourceType domain.SourceType,
	rawContent string,
) (*domain.IngestJob, error) {
	if sourceID != "" {
		src, err := s.sources.FindSource(sourceID)
		if err == nil && !src.Active {
			if s.audit != nil {
				_ = s.audit.LogEvent(ctx, tenantID, "ingest_source_rejected", sourceID, "source inactive")
			}
			return nil, domain.ErrSourceInactive
		}
	}

	normalized := normalizeText(rawContent)
	job := domain.IngestJob{
		IngestJobID:    fmt.Sprintf("ing-%d", time.Now().UnixNano()),
		TenantID:       tenantID,
		SourceID:       sourceID,
		SourceType:     sourceType,
		RawContent:     rawContent,
		NormalizedText: normalized,
		Status:         domain.IngestStatusNormalized,
		CreatedAt:      time.Now(),
	}

	if err := s.ingest.SaveIngestJob(job); err != nil {
		return nil, err
	}
	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "content_origination.ingested", tenantID, "SVC-031", job.IngestJobID)
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "ingest_source_completed", job.IngestJobID, string(sourceType))
	}
	return &job, nil
}

func (s *IngestionService) GetIngestJob(ctx context.Context, jobID string) (*domain.IngestJob, error) {
	return s.ingest.GetIngestJob(jobID)
}

func normalizeText(raw string) string {
	cleaned := strings.TrimSpace(raw)
	cleaned = strings.ReplaceAll(cleaned, "\r\n", "\n")
	return cleaned
}
