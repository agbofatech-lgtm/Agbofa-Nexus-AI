package application

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/story-graph/internal/domain"
)

type KnowledgeIntelligenceService struct {
	entities   domain.EntityRepository
	similarity domain.SimilarityRepository
	aiProvider llm.Provider
	pub        EventPublisher
	audit      AuditLogger
}

func NewKnowledgeIntelligenceService(
	entities domain.EntityRepository,
	similarity domain.SimilarityRepository,
	aiProvider llm.Provider,
	pub EventPublisher,
	audit AuditLogger,
) *KnowledgeIntelligenceService {
	return &KnowledgeIntelligenceService{
		entities:   entities,
		similarity: similarity,
		aiProvider: aiProvider,
		pub:        pub,
		audit:      audit,
	}
}

func (s *KnowledgeIntelligenceService) ExtractAndManageEntity(
	ctx context.Context,
	tenantID, canonicalID, name string,
	entityType domain.EntityType,
	properties map[string]string,
) (*domain.EntityNode, error) {
	existing, err := s.entities.GetEntityByCanonicalID(tenantID, canonicalID)
	if err == nil && existing != nil {
		if s.audit != nil {
			_ = s.audit.LogEvent(ctx, tenantID, "manage_entity_deduplicated", canonicalID, existing.EntityID)
		}
		return existing, nil
	}

	entity := domain.EntityNode{
		EntityID:    fmt.Sprintf("ent-%d", time.Now().UnixNano()),
		TenantID:    tenantID,
		CanonicalID: canonicalID,
		Name:        name,
		EntityType:  entityType,
		Properties:  properties,
	}

	if err := s.entities.SaveEntity(entity); err != nil {
		return nil, err
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "story_graph.entity.created", tenantID, "SVC-122", fmt.Sprintf("entity_id=%s canonical_id=%s", entity.EntityID, canonicalID))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "create_entity", entity.EntityID, name)
	}

	return &entity, nil
}

func (s *KnowledgeIntelligenceService) CalculateSimilarityAndCluster(
	ctx context.Context,
	tenantID, sourceStoryID, targetStoryID, textA, textB string,
) (*domain.SimilarityEdge, error) {
	var score float64 = 0.85
	var clusterID string = fmt.Sprintf("cluster-%s", sourceStoryID)

	if s.aiProvider != nil {
		req := llm.CompletionRequest{
			TenantID: tenantID,
			Model:    "similarity-scorer-v1",
			Messages: []llm.Message{
				{Role: "system", Content: "Calculate semantic similarity score between texts. Reply HIGH, MEDIUM, or LOW."},
				{Role: "user", Content: fmt.Sprintf("TextA: %s\nTextB: %s", textA, textB)},
			},
		}
		resp, err := s.aiProvider.Generate(ctx, req)
		if err == nil && strings.Contains(strings.ToUpper(resp.Content), "LOW") {
			score = 0.30
		}
	}

	if err := domain.ValidateConfidenceThreshold(score, 0.70); err != nil {
		if s.audit != nil {
			_ = s.audit.LogEvent(ctx, tenantID, "similarity_link_rejected", sourceStoryID+":"+targetStoryID, err.Error())
		}
		return nil, err
	}

	edge := domain.SimilarityEdge{
		TenantID:        tenantID,
		SourceStoryID:   sourceStoryID,
		TargetStoryID:   targetStoryID,
		SimilarityScore: score,
		ClusterID:       clusterID,
	}

	if err := s.similarity.SaveSimilarityEdge(edge); err != nil {
		return nil, err
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "story_graph.similarity.linked", tenantID, "SVC-124", fmt.Sprintf("src=%s target=%s score=%.2f", sourceStoryID, targetStoryID, score))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "similarity_linked", clusterID, fmt.Sprintf("score=%.2f", score))
	}

	return &edge, nil
}

func (s *KnowledgeIntelligenceService) GetEntity(ctx context.Context, tenantID, canonicalID string) (*domain.EntityNode, error) {
	return s.entities.GetEntityByCanonicalID(tenantID, canonicalID)
}

func (s *KnowledgeIntelligenceService) ListSimilarStories(ctx context.Context, tenantID, storyID string, minScore float64) ([]domain.SimilarityEdge, error) {
	return s.similarity.ListSimilarStories(tenantID, storyID, minScore)
}
