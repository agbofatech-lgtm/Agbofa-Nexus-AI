package application

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/story-graph/internal/domain"
)

type StoryGraphOrchestrator struct {
	graph      *StoryGraphService
	processed  map[string]bool
	mu         sync.Mutex
	pub        EventPublisher
	audit      AuditLogger
}

func NewStoryGraphOrchestrator(
	graph *StoryGraphService,
	pub EventPublisher,
	audit AuditLogger,
) *StoryGraphOrchestrator {
	return &StoryGraphOrchestrator{
		graph:     graph,
		processed: make(map[string]bool),
		pub:       pub,
		audit:     audit,
	}
}

func (o *StoryGraphOrchestrator) HandleTruthStoryVersionedEvent(
	ctx context.Context,
	eventID, tenantID, storyID string,
	version int,
	provenanceHash string,
) (*domain.WorkflowInstanceRef, error) {
	o.mu.Lock()
	if o.processed[eventID] {
		o.mu.Unlock()
		if o.audit != nil {
			_ = o.audit.LogEvent(ctx, tenantID, "evt_026_idempotent_ignore", eventID, "event already processed")
		}
		return nil, nil
	}
	o.processed[eventID] = true
	o.mu.Unlock()

	wfID := fmt.Sprintf("wf-19-%s-%d", storyID, version)
	wf := domain.WorkflowInstanceRef{
		InstanceID: wfID,
		TenantID:   tenantID,
		WorkflowID: "WF-019",
		Status:     "COMPLETED",
		Parameters: map[string]string{
			"story_id":        storyID,
			"version":         fmt.Sprintf("%d", version),
			"provenance_hash": provenanceHash,
		},
		StartedAt: time.Now(),
	}

	if o.pub != nil {
		_ = o.pub.PublishEvent(ctx, "story_graph.story.versioned", tenantID, "WF-019", fmt.Sprintf("wf_id=%s story_id=%s version=%d", wfID, storyID, version))
	}
	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, tenantID, "wf_019_completed", storyID, fmt.Sprintf("version=%d hash=%s", version, provenanceHash))
	}

	return &wf, nil
}

func (o *StoryGraphOrchestrator) ExecuteStoryGraphCodeWorkflow(
	ctx context.Context,
	tenantID, storyID string,
	params map[string]string,
) (*domain.WorkflowInstanceRef, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	wfID := fmt.Sprintf("wf-32-%s-%d", storyID, time.Now().Unix())
	wf := domain.WorkflowInstanceRef{
		InstanceID: wfID,
		TenantID:   tenantID,
		WorkflowID: "WF-032",
		Status:     "COMPLETED",
		Parameters: params,
		StartedAt:  time.Now(),
	}

	if o.pub != nil {
		_ = o.pub.PublishEvent(ctx, "story_graph.events", tenantID, "WF-032", wfID)
	}
	if o.audit != nil {
		_ = o.audit.LogEvent(ctx, tenantID, "execute_wf_032", storyID, wfID)
	}

	return &wf, nil
}
