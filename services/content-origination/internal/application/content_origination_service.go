package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/content-origination/internal/domain"
)

type ContentOriginationService struct {
	stories   domain.OriginationStoryRepo
	graph     domain.StoryGraphAdapter
	pub       EventPublisher
	audit     AuditLogger
	policy    domain.StoryStatePolicy
}

func NewContentOriginationService(
	stories domain.OriginationStoryRepo,
	graph domain.StoryGraphAdapter,
	pub EventPublisher,
	audit AuditLogger,
) *ContentOriginationService {
	return &ContentOriginationService{
		stories: stories,
		graph:   graph,
		pub:     pub,
		audit:   audit,
		policy:  domain.StoryStatePolicy{},
	}
}

func (s *ContentOriginationService) CreateOriginationStory(
	ctx context.Context,
	tenantID, candidateID, title, summary, sourceID string,
) (*domain.OriginationStory, error) {
	story := domain.OriginationStory{
		StoryID:     fmt.Sprintf("story-%d", time.Now().UnixNano()),
		TenantID:    tenantID,
		CandidateID: candidateID,
		SourceID:    sourceID,
		Title:       title,
		Summary:     summary,
		State:       domain.StoryStateIngested,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if s.graph != nil {
		node, err := s.graph.InitializeOriginationNode(tenantID, story.StoryID, title, sourceID)
		if err == nil && node != nil {
			story.GraphNodeID = node.NodeID
		}
	}

	if err := s.stories.SaveStory(story); err != nil {
		return nil, err
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "create_origination_story", story.StoryID, story.Title)
	}
	return &story, nil
}

func (s *ContentOriginationService) UpdateStoryState(
	ctx context.Context,
	tenantID, storyID string,
	newState domain.StoryState,
	reason string,
) (*domain.OriginationStory, error) {
	story, err := s.stories.GetStory(storyID)
	if err != nil {
		return nil, err
	}

	if err := s.policy.ValidateTransition(story.State, newState); err != nil {
		if s.audit != nil {
			_ = s.audit.LogEvent(ctx, tenantID, "story_state_transition_failed", storyID, err.Error())
		}
		return nil, err
	}

	oldState := story.State
	story.State = newState
	story.UpdatedAt = time.Now()
	if err := s.stories.SaveStory(*story); err != nil {
		return nil, err
	}

	if s.pub != nil {
		_ = s.pub.PublishEvent(
			ctx,
			"content_origination.story_state_changed",
			tenantID,
			"SVC-035",
			fmt.Sprintf("story_id=%s from=%s to=%s", storyID, oldState, newState),
		)

		if newState == domain.StoryStateSubmittedForVerification {
			_ = s.pub.PublishEvent(
				ctx,
				"truth_engine.story.submitted",
				tenantID,
				"SVC-030",
				storyID,
			)
		}
	}

	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "story_state_changed", storyID, fmt.Sprintf("%s -> %s reason=%s", oldState, newState, reason))
	}
	return story, nil
}

func (s *ContentOriginationService) InitializeStoryGraphNode(
	ctx context.Context,
	tenantID, storyID, title, sourceID string,
) (*domain.GraphNodeRef, error) {
	if s.graph == nil {
		return nil, domain.ErrDownstreamBoundary
	}
	node, err := s.graph.InitializeOriginationNode(tenantID, storyID, title, sourceID)
	if err != nil {
		return nil, err
	}
	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "content_origination.graph_node_initialized", tenantID, "SVC-034", node.NodeID)
	}
	return node, nil
}

func (s *ContentOriginationService) ExecuteOriginationWorkflow(
	ctx context.Context,
	tenantID, workflowID string,
	params map[string]string,
) (string, error) {
	execID := fmt.Sprintf("wf-exec-%d", time.Now().UnixNano())
	if s.pub != nil {
		_ = s.pub.PublishEvent(ctx, "content_origination.workflow.started", tenantID, "SVC-036", execID)
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, tenantID, "execute_origination_workflow", workflowID, execID)
	}
	return execID, nil
}
