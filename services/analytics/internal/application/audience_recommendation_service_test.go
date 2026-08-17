package application_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/analytics/internal/application"
	"github.com/agbofa/nexus/services/analytics/internal/domain"
)

type inMemSegmentRepo struct {
	segments map[string]domain.AudienceSegmentEntity
}

func newInMemSegmentRepo() *inMemSegmentRepo {
	return &inMemSegmentRepo{segments: make(map[string]domain.AudienceSegmentEntity)}
}

func (r *inMemSegmentRepo) SaveSegment(s domain.AudienceSegmentEntity) error {
	r.segments[s.TenantID+":"+s.SegmentID] = s
	return nil
}

func (r *inMemSegmentRepo) GetSegment(tenantID, segmentID string) (*domain.AudienceSegmentEntity, error) {
	s, ok := r.segments[tenantID+":"+segmentID]
	if !ok {
		return nil, domain.ErrSegmentNotFound
	}
	return &s, nil
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

func TestAudienceRecommendationService_Flow(t *testing.T) {
	segments := newInMemSegmentRepo()
	provider := &mockLLMProvider{id: "ai-rec", name: "RecRanker", content: "story-2,story-1"}
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewAudienceRecommendationService(segments, provider, pub, audit)

	seg, err := svc.UpdateAudienceSegment(
		context.Background(),
		"tenant-1",
		"seg-100",
		"Tech Enthusiasts",
		0.88,
		[]string{"AI", "MEDIA"},
	)
	if err != nil || seg == nil {
		t.Fatalf("expected segment updated, got err=%v", err)
	}
	if seg.ProvenanceHash == "" {
		t.Fatalf("expected provenance hash recorded")
	}

	recs, err := svc.GenerateRecommendations(context.Background(), "tenant-1", "seg-100", []string{"story-1", "story-2"})
	if err != nil || len(recs) != 2 {
		t.Fatalf("expected 2 ranked recommendations, got err=%v recs=%v", err, recs)
	}
	if recs[0] != "story-2" {
		t.Fatalf("expected story-2 ranked first by mock LLM, got %s", recs[0])
	}
	if len(pub.events) < 2 {
		t.Fatalf("expected events emitted, got %d", len(pub.events))
	}

	_, err = svc.UpdateAudienceSegment(context.Background(), "", "seg-1", "name", 0.5, nil)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenant, got %v", err)
	}
}
