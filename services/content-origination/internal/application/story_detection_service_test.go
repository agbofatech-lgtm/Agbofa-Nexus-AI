package application_test

import (
	"context"
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/content-origination/internal/application"
	"github.com/agbofa/nexus/services/content-origination/internal/domain"
)

type mockLLMProvider struct {
	id      string
	name    string
	content string
}

func (m *mockLLMProvider) ID() string   { return m.id }
func (m *mockLLMProvider) Name() string { return m.name }
func (m *mockLLMProvider) Generate(ctx context.Context, req llm.CompletionRequest) (llm.CompletionResponse, error) {
	return llm.CompletionResponse{
		ProviderID:       m.id,
		Model:            req.Model,
		Content:          m.content,
		TotalTokens:      25,
		Latency:          15 * time.Millisecond,
	}, nil
}

type inMemCandidateRepo struct {
	candidates map[string]domain.StoryCandidate
}

func newInMemCandidateRepo() *inMemCandidateRepo {
	return &inMemCandidateRepo{candidates: make(map[string]domain.StoryCandidate)}
}

func (r *inMemCandidateRepo) SaveCandidate(c domain.StoryCandidate) error {
	r.candidates[c.CandidateID] = c
	return nil
}

func (r *inMemCandidateRepo) GetCandidate(id string) (*domain.StoryCandidate, error) {
	c, ok := r.candidates[id]
	if !ok {
		return nil, domain.ErrCandidateNotFound
	}
	return &c, nil
}

func TestStoryDetectionService_DetectStories(t *testing.T) {
	ingest := newInMemIngestRepo()
	candidates := newInMemCandidateRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}
	provider := &mockLLMProvider{
		id:      "ai-detector",
		name:    "AIDetector",
		content: "Autonomous AI Newsroom Launches\nAn autonomous AI media platform introduces automated content origination.",
	}

	svc := application.NewStoryDetectionService(ingest, candidates, provider, pub, audit)

	res, err := svc.DetectStories(
		context.Background(),
		"tenant-1",
		"ing-101",
		"Raw ingested content about AI Newsrooms...",
		0.75,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(res) != 1 {
		t.Fatalf("expected 1 candidate, got %d", len(res))
	}
	if res[0].Title != "Autonomous AI Newsroom Launches" {
		t.Fatalf("unexpected title: %s", res[0].Title)
	}
	if len(pub.events) == 0 {
		t.Fatalf("expected story_detected event published")
	}
}
