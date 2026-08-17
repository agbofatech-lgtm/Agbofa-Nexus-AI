package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/story-graph/internal/application"
	"github.com/agbofa/nexus/services/story-graph/internal/domain"
)

type inMemSearchRepo struct {
	nodes []domain.StoryNode
}

func newInMemSearchRepo() *inMemSearchRepo {
	return &inMemSearchRepo{}
}

func (r *inMemSearchRepo) SearchNodes(filter domain.GraphQueryFilter) ([]domain.StoryNode, error) {
	var out []domain.StoryNode
	for _, n := range r.nodes {
		if n.TenantID == filter.TenantID && n.ConfidenceScore >= filter.MinConfidence {
			out = append(out, n)
		}
	}
	return out, nil
}

type inMemMemoryRepo struct {
	archivedCount int
}

func newInMemMemoryRepo() *inMemMemoryRepo {
	return &inMemMemoryRepo{}
}

func (r *inMemMemoryRepo) ArchiveOldNodes(policy domain.MemoryArchivePolicy) (int, int, error) {
	r.archivedCount += 5
	return 5, 10, nil
}

func TestGraphSearchAndMemoryService_SearchTenantIsolation(t *testing.T) {
	nodes := newInMemStoryNodeRepo()
	search := newInMemSearchRepo()
	memory := newInMemMemoryRepo()

	svc := application.NewGraphSearchAndMemoryService(nodes, search, memory, nil, nil)

	_, err := svc.SearchStoryGraph(context.Background(), domain.GraphQueryFilter{
		QueryText: "AI",
	})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenant filter, got %v", err)
	}
}

func TestGraphSearchAndMemoryService_ArchiveMemory(t *testing.T) {
	nodes := newInMemStoryNodeRepo()
	search := newInMemSearchRepo()
	memory := newInMemMemoryRepo()
	pub := &mockPublisher{}

	svc := application.NewGraphSearchAndMemoryService(nodes, search, memory, pub, nil)

	n, r, err := svc.ArchiveStoryMemory(context.Background(), domain.MemoryArchivePolicy{
		TenantID:             "tenant-1",
		ArchiveThresholdDays: 30,
	})
	if err != nil || n != 5 || r != 10 {
		t.Fatalf("expected 5 nodes and 10 rels archived, got n=%d r=%d err=%v", n, r, err)
	}
	if len(pub.events) == 0 {
		t.Fatalf("expected story_graph.memory.archived event published")
	}
}
