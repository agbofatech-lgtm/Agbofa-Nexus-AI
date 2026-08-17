package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/story-graph/internal/domain"
)

type EventPublisher interface {
	PublishEvent(ctx context.Context, eventType, tenantID, source, payload string) error
}

type AuditLogger interface {
	LogEvent(ctx context.Context, tenantID, action, resource, details string) error
}

type StoryGraphService struct {
	nodes  domain.StoryNodeRepository
	rels   domain.RelationshipRepository
	pub    EventPublisher
	audit  AuditLogger
}

func NewStoryGraphService(
	nodes domain.StoryNodeRepository,
	rels domain.RelationshipRepository,
	pub EventPublisher,
	audit AuditLogger,
) *StoryGraphService {
	return &StoryGraphService{
		nodes: nodes,
		rels:  rels,
		pub:   pub,
		audit: audit,
	}
}

func (s *StoryGraphService) SyncStoryNode(
	ctx context.Context,
	tenantID, storyID, title, truthState string,
	confidence float64,
	sourceID, provenanceHash string,
) (*domain.StoryNode, error) {
	existing, err := s.nodes.GetStoryNode(tenantID, storyID)
	version := 1
	if err == nil && existing != nil {
		version = existing.Version + 1
	}

	node := domain.StoryNode{
		NodeID:          fmt.Sprintf("node-%s", storyID),
		TenantID:        tenantID,
		StoryID:         storyID,
		Title:           title,
		TruthState:      truthState,
		ConfidenceScore: confidence,
		Version:         version,
		ValidFrom:       time.Now(),
		ValidTo:         time.Date(9999, 12, 31, 23, 59, 59, 0, time.UTC),
	}

	if err := s.nodes.SaveStoryNode(node); err != nil {
		return nil, err
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "story_graph.node.synchronized", tenantID, "SVC-043", fmt.Sprintf("node_id=%s version=%d state=%s", node.NodeID, version, truthState))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "sync_story_node", storyID, fmt.Sprintf("node_id=%s version=%d", node.NodeID, version))
	}

	return &node, nil
}

func (s *StoryGraphService) GetStoryNode(ctx context.Context, tenantID, storyID string) (*domain.StoryNode, error) {
	return s.nodes.GetStoryNode(tenantID, storyID)
}

func (s *StoryGraphService) LinkNodes(
	ctx context.Context,
	tenantID, sourceNodeID, targetNodeID string,
	relType domain.RelType,
	weight float64,
) (*domain.GraphRelationship, error) {
	rel := domain.GraphRelationship{
		RelID:        fmt.Sprintf("rel-%d", time.Now().UnixNano()),
		TenantID:     tenantID,
		SourceNodeID: sourceNodeID,
		TargetNodeID: targetNodeID,
		RelType:      relType,
		Weight:       weight,
		ValidFrom:    time.Now(),
		ValidTo:      time.Date(9999, 12, 31, 23, 59, 59, 0, time.UTC),
	}

	if err := s.rels.SaveRelationship(rel); err != nil {
		return nil, err
	}

	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "link_graph_nodes", rel.RelID, fmt.Sprintf("src=%s target=%s type=%s", sourceNodeID, targetNodeID, relType))
	}

	return &rel, nil
}
