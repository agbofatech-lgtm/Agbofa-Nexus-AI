package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/story-graph/internal/application"
	"github.com/agbofa/nexus/services/story-graph/internal/domain"
)

func TestStoryGraphOrchestrator_EVT026Idempotency(t *testing.T) {
	pub := &mockPublisher{}
	audit := &mockAudit{}

	orch := application.NewStoryGraphOrchestrator(nil, pub, audit)

	wf1, err := orch.HandleTruthStoryVersionedEvent(context.Background(), "evt-500", "tenant-1", "story-10", 2, "hash-02")
	if err != nil || wf1 == nil {
		t.Fatalf("expected first event processing to succeed, got err=%v", err)
	}

	wf2, err := orch.HandleTruthStoryVersionedEvent(context.Background(), "evt-500", "tenant-1", "story-10", 2, "hash-02")
	if err != nil {
		t.Fatalf("unexpected error on duplicate event: %v", err)
	}
	if wf2 != nil {
		t.Fatalf("expected nil return on idempotent duplicate event, got %v", wf2)
	}
}

func TestStoryGraphOrchestrator_WF032TenantIsolation(t *testing.T) {
	orch := application.NewStoryGraphOrchestrator(nil, nil, nil)

	_, err := orch.ExecuteStoryGraphCodeWorkflow(context.Background(), "", "story-10", nil)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for missing tenant, got %v", err)
	}
}
