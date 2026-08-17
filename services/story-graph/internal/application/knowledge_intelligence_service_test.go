package application_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/story-graph/internal/application"
	"github.com/agbofa/nexus/services/story-graph/internal/domain"
)

type inMemEntityRepo struct {
	entities map[string]domain.EntityNode
}

func newInMemEntityRepo() *inMemEntityRepo {
	return &inMemEntityRepo{entities: make(map[string]domain.EntityNode)}
}

func (r *inMemEntityRepo) SaveEntity(e domain.EntityNode) error {
	r.entities[e.TenantID+":"+e.CanonicalID] = e
	return nil
}

func (r *inMemEntityRepo) GetEntityByCanonicalID(tenantID, canonicalID string) (*domain.EntityNode, error) {
	e, ok := r.entities[tenantID+":"+canonicalID]
	if !ok {
		return nil, domain.ErrEntityNotFound
	}
	return &e, nil
}

type inMemSimilarityRepo struct {
	edges []domain.SimilarityEdge
}

func newInMemSimilarityRepo() *inMemSimilarityRepo {
	return &inMemSimilarityRepo{}
}

func (r *inMemSimilarityRepo) SaveSimilarityEdge(edge domain.SimilarityEdge) error {
	r.edges = append(r.edges, edge)
	return nil
}

func (r *inMemSimilarityRepo) ListSimilarStories(tenantID, storyID string, minScore float64) ([]domain.SimilarityEdge, error) {
	var out []domain.SimilarityEdge
	for _, e := range r.edges {
		if e.TenantID == tenantID && e.SourceStoryID == storyID && e.SimilarityScore >= minScore {
			out = append(out, e)
		}
	}
	return out, nil
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
		TotalTokens: 20,
		Latency:     10 * time.Millisecond,
	}, nil
}

func TestKnowledgeIntelligenceService_EntityDeduplication(t *testing.T) {
	entities := newInMemEntityRepo()
	similarity := newInMemSimilarityRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewKnowledgeIntelligenceService(entities, similarity, nil, pub, audit)

	ent1, err := svc.ExtractAndManageEntity(context.Background(), "tenant-1", "canon-100", "Agbofa Technologies", domain.EntityTypeOrganization, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	ent2, err := svc.ExtractAndManageEntity(context.Background(), "tenant-1", "canon-100", "Agbofa Technologies Inc.", domain.EntityTypeOrganization, nil)
	if err != nil {
		t.Fatalf("unexpected error on duplicate canonical ID: %v", err)
	}
	if ent1.EntityID != ent2.EntityID {
		t.Fatalf("expected existing entity ID %s returned for duplicate, got %s", ent1.EntityID, ent2.EntityID)
	}
}

func TestKnowledgeIntelligenceService_SimilarityThreshold(t *testing.T) {
	entities := newInMemEntityRepo()
	similarity := newInMemSimilarityRepo()
	provider := &mockLLMProvider{id: "ai-sim", name: "AISim", content: "LOW similarity"}

	svc := application.NewKnowledgeIntelligenceService(entities, similarity, provider, nil, nil)

	_, err := svc.CalculateSimilarityAndCluster(context.Background(), "tenant-1", "story-a", "story-b", "AI news", "Cooking recipes")
	if !errors.Is(err, domain.ErrLowConfidenceMutation) {
		t.Fatalf("expected ErrLowConfidenceMutation, got %v", err)
	}
}
