package application_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/content-origination/internal/application"
	"github.com/agbofa/nexus/services/content-origination/internal/domain"
)

type inMemStoryRepo struct {
	stories map[string]domain.OriginationStory
}

func newInMemStoryRepo() *inMemStoryRepo {
	return &inMemStoryRepo{stories: make(map[string]domain.OriginationStory)}
}

func (r *inMemStoryRepo) SaveStory(s domain.OriginationStory) error {
	r.stories[s.StoryID] = s
	return nil
}

func (r *inMemStoryRepo) GetStory(id string) (*domain.OriginationStory, error) {
	s, ok := r.stories[id]
	if !ok {
		return nil, domain.ErrStoryNotFound
	}
	return &s, nil
}

type mockStoryGraphAdapter struct {
	nodes map[string]domain.GraphNodeRef
}

func newMockStoryGraphAdapter() *mockStoryGraphAdapter {
	return &mockStoryGraphAdapter{nodes: make(map[string]domain.GraphNodeRef)}
}

func (m *mockStoryGraphAdapter) InitializeOriginationNode(tenantID, storyID, title, sourceID string) (*domain.GraphNodeRef, error) {
	ref := domain.GraphNodeRef{
		NodeID:        "node-" + storyID,
		TenantID:      tenantID,
		StoryID:       storyID,
		Title:         title,
		SourceID:      sourceID,
		InitializedAt: time.Now(),
	}
	m.nodes[storyID] = ref
	return &ref, nil
}

func TestContentOriginationService_Flow(t *testing.T) {
	stories := newInMemStoryRepo()
	graph := newMockStoryGraphAdapter()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewContentOriginationService(stories, graph, pub, audit)

	story, err := svc.CreateOriginationStory(
		context.Background(),
		"tenant-1",
		"cand-01",
		"AI Platform Scales",
		"An article summary...",
		"src-01",
	)
	if err != nil {
		t.Fatalf("failed to create origination story: %v", err)
	}
	if story.GraphNodeID != "node-"+story.StoryID {
		t.Fatalf("expected graph node ID set via adapter, got %s", story.GraphNodeID)
	}

	updated, err := svc.UpdateStoryState(context.Background(), "tenant-1", story.StoryID, domain.StoryStateDetected, "detection completed")
	if err != nil {
		t.Fatalf("unexpected update error: %v", err)
	}
	if updated.State != domain.StoryStateDetected {
		t.Fatalf("expected state DETECTED, got %s", updated.State)
	}

	_, _ = svc.UpdateStoryState(context.Background(), "tenant-1", story.StoryID, domain.StoryStateIdeaGenerated, "idea generated")
	_, _ = svc.UpdateStoryState(context.Background(), "tenant-1", story.StoryID, domain.StoryStatePitched, "pitched to newsroom")
	final, err := svc.UpdateStoryState(context.Background(), "tenant-1", story.StoryID, domain.StoryStateSubmittedForVerification, "ready for truth engine")
	if err != nil {
		t.Fatalf("unexpected error transitioning to verification: %v", err)
	}
	if final.State != domain.StoryStateSubmittedForVerification {
		t.Fatalf("expected state SUBMITTED_FOR_VERIFICATION, got %s", final.State)
	}

	foundSubmittedEvent := false
	for _, evt := range pub.events {
		if evt == "truth_engine.story.submitted:"+story.StoryID {
			foundSubmittedEvent = true
			break
		}
	}
	if !foundSubmittedEvent {
		t.Fatalf("expected truth_engine.story.submitted event emitted")
	}

	_, err = svc.UpdateStoryState(context.Background(), "tenant-1", story.StoryID, domain.StoryStatePitched, "invalid backward step")
	if !errors.Is(err, domain.ErrInvalidStateTransition) {
		t.Fatalf("expected ErrInvalidStateTransition, got %v", err)
	}
}
