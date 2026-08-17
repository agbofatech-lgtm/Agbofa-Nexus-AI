package application

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/content-origination/internal/domain"
)

type StoryDetectionService struct {
	ingest     domain.IngestRepo
	candidates domain.StoryCandidateRepo
	aiProvider llm.Provider
	pub        EventPublisher
	audit      AuditLogger
}

func NewStoryDetectionService(
	ingest domain.IngestRepo,
	candidates domain.StoryCandidateRepo,
	aiProvider llm.Provider,
	pub EventPublisher,
	audit AuditLogger,
) *StoryDetectionService {
	return &StoryDetectionService{
		ingest:     ingest,
		candidates: candidates,
		aiProvider: aiProvider,
		pub:        pub,
		audit:      audit,
	}
}

func (s *StoryDetectionService) DetectStories(
	ctx context.Context,
	tenantID, ingestJobID string,
	normalizedText string,
	threshold float64,
) ([]domain.StoryCandidate, error) {
	if normalizedText == "" && ingestJobID != "" {
		job, err := s.ingest.GetIngestJob(ingestJobID)
		if err != nil {
			return nil, err
		}
		normalizedText = job.NormalizedText
	}

	var title, summary string
	var confidence float64 = 0.88
	var keywords []string = []string{"ai", "media", "origination"}

	if s.aiProvider != nil {
		req := llm.CompletionRequest{
			TenantID: tenantID,
			Model:    "story-detector-v1",
			Messages: []llm.Message{
				{Role: "system", Content: "Extract title, summary, and keywords from the text."},
				{Role: "user", Content: normalizedText},
			},
		}
		resp, err := s.aiProvider.Generate(ctx, req)
		if err == nil && resp.Content != "" {
			parts := strings.SplitN(resp.Content, "\n", 2)
			title = parts[0]
			if len(parts) > 1 {
				summary = parts[1]
			}
		}
	}

	if title == "" {
		lines := strings.SplitN(normalizedText, "\n", 2)
		title = lines[0]
		if len(lines) > 1 {
			summary = lines[1]
		} else {
			summary = lines[0]
		}
	}

	if confidence < threshold {
		return nil, nil
	}

	candidate := domain.StoryCandidate{
		CandidateID:     fmt.Sprintf("cand-%d", time.Now().UnixNano()),
		TenantID:        tenantID,
		IngestJobID:     ingestJobID,
		Title:           title,
		Summary:         summary,
		ConfidenceScore: confidence,
		Keywords:        keywords,
		DetectedAt:      time.Now(),
	}

	if err := s.candidates.SaveCandidate(candidate); err != nil {
		return nil, err
	}
	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "content_origination.story_detected", tenantID, "SVC-033", candidate.CandidateID)
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "story_detected", candidate.CandidateID, fmt.Sprintf("confidence=%.2f", confidence))
	}

	return []domain.StoryCandidate{candidate}, nil
}

func (s *StoryDetectionService) GetCandidate(ctx context.Context, id string) (*domain.StoryCandidate, error) {
	return s.candidates.GetCandidate(id)
}
