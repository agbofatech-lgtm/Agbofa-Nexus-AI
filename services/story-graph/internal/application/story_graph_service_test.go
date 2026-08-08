package application_test

import (
	"context"
	"testing"

	"github.com/agbofa/nexus/services/story-graph/internal/application"
	"github.com/agbofa/nexus/services/story-graph/internal/domain"
)

type inMemStoryNodeRepo struct {
	nodes map[string]domain.StoryNode
}

func newInMemStoryNodeRepo() *inMemStoryNodeRepo {
	return &inMemStoryNodeRepo{nodes: make(map[string]domain.StoryNode)}
}

func (r *inMemStoryNodeRepo) SaveStoryNode(n domain.StoryNode) error {
	r.nodes[n.TenantID+":"+n.StoryID] = n
	return nil
}

func (r *inMemStoryNodeRepo) GetStoryNode(tenantID, storyID string) (*domain.StoryNode, error) {
	n, ok := r.nodes[tenantID+":"+storyID]
	if !ok {
		return nil, domain.ErrNodeNotFound
	}
	return &n, nil
}

type inMemRelRepo struct {
	rels map[string]domain.GraphRelationship
}

func newInMemRelRepo() *inMemRelRepo {
	return &inMemRelRepo{rels: make(map[string]domain.GraphRelationship)}
}

func (r *inMemRelRepo) SaveRelationship(rel domain.GraphRelationship) error {
	r.rels[rel.RelID] = rel
	return nil
}

func (r *inMemRelRepo) ListRelationships(tenantID, sourceNodeID string) ([]domain.GraphRelationship, error) {
	var out []domain.GraphRelationship
	for _, rel := range r.rels {
		if rel.TenantID == tenantID && rel.SourceNodeID == sourceNodeID {
			out = append(out, rel)
		}
	}
	return out, nil
}

type mockPublisher struct {
	events []string
}

func (m *mockPublisher) PublishEvent(ctx context.Context, eventType, tenantID, source, payload string) error {
	m.events = append(m.events, eventType+":"+payload)
	return nil
}

type mockAudit struct {
	logs []string
}

func (m *mockAudit) LogEvent(ctx context.Context, tenantID, action, resource, details string) error {
	m.logs = append(m.logs, action+":"+resource)
	return nil
}

func TestStoryGraphService_SyncAndLink(t *testing.T) {
	nodes := newInMemStoryNodeRepo()
	rels := newInMemRelRepo()
	pub := &mockPublisher{}
	audit := &mockAudit{}

	svc := application.NewStoryGraphService(nodes, rels, pub, audit)

	node1, err := svc.SyncStoryNode(
		context.Background(),
		"tenant-1",
		"story-10",
		"AI Platform Breakthrough",
		"VERIFIED",
		0.90,
		"src-01",
		"hash-10",
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if node1.Version != 1 {
		t.Fatalf("expected version 1, got %d", node1.Version)
	}

	node2, _ := svc.SyncStoryNode(
		context.Background(),
		"tenant-1",
		"story-10",
		"AI Platform Breakthrough Updated",
		"VERIFIED",
		0.95,
		"src-01",
		"hash-11",
	)
	if node2.Version != 2 {
		t.Fatalf("expected version 2 on resync, got %d", node2.Version)
	}

	rel, err := svc.LinkNodes(context.Background(), "tenant-1", node1.NodeID, "node-other", domain.RelTypeCorroborates, 0.85)
	if err != nil || rel == nil {
		t.Fatalf("expected relationship created, got err=%v", err)
	}
	if len(pub.events) == 0 {
		t.Fatalf("expected story_graph.node.synchronized event published")
	}
}
