package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/story-graph/internal/domain"
)

type GraphSearchAndMemoryService struct {
	nodes    domain.StoryNodeRepository
	search   domain.GraphSearchRepository
	memory   domain.MemoryRepository
	pub      EventPublisher
	audit    AuditLogger
}

func NewGraphSearchAndMemoryService(
	nodes domain.StoryNodeRepository,
	search domain.GraphSearchRepository,
	memory domain.MemoryRepository,
	pub EventPublisher,
	audit AuditLogger,
) *GraphSearchAndMemoryService {
	return &GraphSearchAndMemoryService{
		nodes:  nodes,
		search: search,
		memory: memory,
		pub:    pub,
		audit:  audit,
	}
}

func (s *GraphSearchAndMemoryService) VersionStoryNode(
	ctx context.Context,
	tenantID, storyID string,
	newVersion int,
	reason string,
) (*domain.StoryNode, error) {
	node, err := s.nodes.GetStoryNode(tenantID, storyID)
	if err != nil {
		return nil, err
	}

	node.Version = newVersion
	node.ValidFrom = time.Now()
	if err := s.nodes.SaveStoryNode(*node); err != nil {
		return nil, err
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "story_graph.story.versioned", tenantID, "SVC-123", fmt.Sprintf("story_id=%s version=%d reason=%s", storyID, newVersion, reason))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "version_story_graph", storyID, fmt.Sprintf("version=%d reason=%s", newVersion, reason))
	}

	return node, nil
}

func (s *GraphSearchAndMemoryService) SearchStoryGraph(
	ctx context.Context,
	filter domain.GraphQueryFilter,
) ([]domain.StoryNode, error) {
	if filter.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	results, err := s.search.SearchNodes(filter)
	if err != nil {
		return nil, err
	}

	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, filter.TenantID, "search_story_graph", filter.QueryText, fmt.Sprintf("found=%d", len(results)))
	}

	return results, nil
}

func (s *GraphSearchAndMemoryService) ArchiveStoryMemory(
	ctx context.Context,
	policy domain.MemoryArchivePolicy,
) (int, int, error) {
	if policy.TenantID == "" {
		return 0, 0, domain.ErrCrossTenantViolation
	}

	archivedNodes, archivedRels, err := s.memory.ArchiveOldNodes(policy)
	if err != nil {
		return 0, 0, err
	}

	if s.pub != nil && (archivedNodes > 0 || archivedRels > 0) {
		_ = s.pub.PublishEvent(ctx, "story_graph.memory.archived", policy.TenantID, "SVC-126", fmt.Sprintf("nodes=%d rels=%d", archivedNodes, archivedRels))
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, policy.TenantID, "archive_story_memory", "system", fmt.Sprintf("nodes=%d rels=%d", archivedNodes, archivedRels))
	}

	return archivedNodes, archivedRels, nil
}
