package application_test

import (
	"context"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/truth-engine/internal/application"
	"github.com/agbofa/nexus/services/truth-engine/internal/domain"
)

type inMemTruthStoryRepo struct {
	stories map[string]domain.TruthStory
}

func newInMemTruthStoryRepo() *inMemTruthStoryRepo {
	return &inMemTruthStoryRepo{stories: make(map[string]domain.TruthStory)}
}

func (r *inMemTruthStoryRepo) SaveTruthStory(s domain.TruthStory) error {
	r.stories[s.StoryID] = s
	return nil
}

func (r *inMemTruthStoryRepo) GetTruthStory(id string) (*domain.TruthStory, error) {
	s, ok := r.stories[id]
	if !ok {
		return nil, domain.ErrTruthStoryNotFound
	}
	return &s, nil
}

type mockTruthGraphAdapter struct {
	nodes map[string]domain.TruthGraphNodeRef
}

func newMockTruthGraphAdapter() *mockTruthGraphAdapter {
	return &mockTruthGraphAdapter{nodes: make(map[string]domain.TruthGraphNodeRef)}
}

func (m *mockTruthGraphAdapter) InitializeTruthNode(tenantID, storyID, truthState string, confidence float64) (*domain.TruthGraphNodeRef, error) {
	node := domain.TruthGraphNodeRef{
		NodeID:          "truth-node-" + storyID,
		TenantID:        tenantID,
		StoryID:         storyID,
		TruthState:      truthState,
		ConfidenceScore: confidence,
		InitializedAt:   time.Now(),
	}
	m.nodes[storyID] = node
	return &node, nil
}

func TestTruthEngineService_HandleStorySubmittedEvent(t *testing.T) {
	stories := newInMemTruthStoryRepo()
	sources := newInMemSourceRepo()
	claims := newInMemClaimRepo()
	misinfo := newInMemMisinfoRepo()
	ledger := newInMemLedgerRepo()
	graph := newMockTruthGraphAdapter()
	pub := &mockPublisher{}

	sourceSvc := application.NewSourceVerificationService(sources, ledger, pub, nil)
	claimSvc := application.NewClaimVerificationService(claims, ledger, nil, pub, nil)
	scoringSvc := application.NewTruthScoringService(misinfo, ledger, nil, pub, nil)
	editorialSvc := application.NewEditorialDecisionService(ledger, pub, nil)

	engine := application.NewTruthEngineService(
		stories,
		sourceSvc,
		claimSvc,
		scoringSvc,
		editorialSvc,
		graph,
		ledger,
		pub,
		nil,
	)

	// Consume EVT-019 input boundary from IMP-007 Content Origination!
	story, err := engine.HandleStorySubmittedEvent(
		context.Background(),
		"tenant-1",
		"story-orig-500",
		"AI Platform Breakthrough",
		"Summary of verified factual claims...",
		"src-10",
		[]string{"Claim 1: 40% efficiency boost"},
	)
	if err != nil {
		t.Fatalf("unexpected error handling EVT-019: %v", err)
	}
	if story.State != domain.TruthStateVerified {
		t.Fatalf("expected VERIFIED truth state, got %s", story.State)
	}
	if story.ConfidenceScore < 0.85 || story.Tier != domain.ConfidenceTierVerifiedTruth {
		t.Fatalf("expected VERIFIED_TRUTH tier, got score=%.2f tier=%s", story.ConfidenceScore, story.Tier)
	}
	if story.GraphNodeID != "truth-node-story-orig-500" {
		t.Fatalf("expected truth story graph node initialized via adapter boundary, got %s", story.GraphNodeID)
	}
	if len(ledger.records) < 4 {
		t.Fatalf("expected full provenance audit trail recorded, got %d records", len(ledger.records))
	}
}
