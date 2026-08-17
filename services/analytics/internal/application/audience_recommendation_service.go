package application

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/analytics/internal/domain"
)

type AudienceRecommendationService struct {
	segments   domain.AudienceSegmentRepository
	aiProvider llm.Provider
	pub        EventPublisher
	audit      AuditLogger
}

func NewAudienceRecommendationService(
	segments domain.AudienceSegmentRepository,
	aiProvider llm.Provider,
	pub EventPublisher,
	audit AuditLogger,
) *AudienceRecommendationService {
	return &AudienceRecommendationService{
		segments:   segments,
		aiProvider: aiProvider,
		pub:        pub,
		audit:      audit,
	}
}

func (s *AudienceRecommendationService) UpdateAudienceSegment(
	ctx context.Context,
	tenantID, segmentID, name string,
	score float64,
	topCategories []string,
) (*domain.AudienceSegmentEntity, error) {
	if tenantID == "" || segmentID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	ts := time.Now().Unix()
	hash := domain.GenerateAnalyticsHash(tenantID, segmentID, string(domain.SignalCategoryInferredSignals), "UPDATE_SEGMENT", ts)

	seg := domain.AudienceSegmentEntity{
		SegmentID:       segmentID,
		TenantID:        tenantID,
		Name:            name,
		EngagementScore: score,
		TopCategories:   topCategories,
		ProvenanceHash:  hash,
		UpdatedAt:       time.Now(),
	}

	if err := s.segments.SaveSegment(seg); err != nil {
		return nil, err
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "analytics.events", tenantID, "SVC-078", fmt.Sprintf("seg=%s score=%.2f", segmentID, score))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "update_audience_segment", segmentID, fmt.Sprintf("score=%.2f", score))
	}

	return &seg, nil
}

func (s *AudienceRecommendationService) GenerateRecommendations(
	ctx context.Context,
	tenantID, cohortID string,
	candidateStoryIDs []string,
) ([]string, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	recommended := candidateStoryIDs

	if s.aiProvider != nil && len(candidateStoryIDs) > 0 {
		req := llm.CompletionRequest{
			TenantID: tenantID,
			Model:    "recommendation-ranker-v1",
			Messages: []llm.Message{
				{Role: "system", Content: "Rank candidate story IDs by audience cohort relevance."},
				{Role: "user", Content: fmt.Sprintf("Cohort: %s\nCandidates: %s", cohortID, strings.Join(candidateStoryIDs, ","))},
			},
		}
		resp, err := s.aiProvider.Generate(ctx, req)
		if err == nil && resp.Content != "" {
			parts := strings.Split(strings.TrimSpace(resp.Content), ",")
			if len(parts) > 0 {
				recommended = parts
			}
		}
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "analytics.optimization", tenantID, "SVC-079", fmt.Sprintf("cohort=%s recs=%d", cohortID, len(recommended)))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "generate_recommendations", cohortID, fmt.Sprintf("count=%d", len(recommended)))
	}

	return recommended, nil
}

func (s *AudienceRecommendationService) GetAudienceSegment(ctx context.Context, tenantID, segmentID string) (*domain.AudienceSegmentEntity, error) {
	return s.segments.GetSegment(tenantID, segmentID)
}
