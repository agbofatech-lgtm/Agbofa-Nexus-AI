package pipeline

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestStoryGraphUpdaterLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewStoryGraphUpdater(nil, nil, nil)
	ctx := context.Background()

	if agent.ID() != "AGT-026" || agent.Name() != "Story Graph Updater" {
		t.Fatalf("unexpected agent identity: %s / %s", agent.ID(), agent.Name())
	}

	// Uninitialized health check should fail
	if _, err := agent.HealthCheck(ctx); err == nil {
		t.Fatalf("expected error on uninitialized health check")
	}

	// Empty tenant ID should return ErrCrossTenantViolation
	if err := agent.Initialize(ctx, "", nil); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID, got %v", err)
	}

	// Initialize with tenant-A
	if err := agent.Initialize(ctx, "tenant-A", nil); err != nil {
		t.Fatalf("unexpected initialization error: %v", err)
	}

	if health, err := agent.HealthCheck(ctx); err != nil || health.Status != "HEALTHY" {
		t.Fatalf("expected HEALTHY health check after initialize")
	}

	// Cross-tenant operation should be rejected
	crossPayload := &domain.PipelinePayload{
		PayloadID: "pay-1",
		TenantID:  "tenant-B",
	}
	if _, err := agent.Operate(ctx, crossPayload); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for cross-tenant payload")
	}

	// Shutdown
	_ = agent.Shutdown(ctx)
	if _, err := agent.HealthCheck(ctx); err == nil {
		t.Fatalf("expected error on health check after shutdown")
	}
}

func TestStoryGraphUpdaterNodeCreationAndLifecycle(t *testing.T) {
	agent := NewStoryGraphUpdater(nil, nil, nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	// 1. Initial detection -> EMERGING
	p1 := &domain.PipelinePayload{
		PayloadID:       "pay-node-1",
		TenantID:        "tenant-XYZ",
		Content:         "Initial market alert story",
		ConfidenceScore: 0.75,
		Sources: []domain.Source{
			{SourceID: "s-1", Name: "Source 1"},
		},
		Metadata: map[string]string{
			"entities":   "Market,CentralBank,Rate",
			"event_name": "RateDecision2026",
			"topic_name": "MonetaryPolicy",
		},
	}
	res1, err := agent.Operate(ctx, p1)
	if err != nil {
		t.Fatalf("unexpected error on create story node: %v", err)
	}
	if res1.Metadata["action"] != "CREATED" || res1.Metadata["new_status"] != "EMERGING" {
		t.Fatalf("expected CREATED / EMERGING, got %s / %s", res1.Metadata["action"], res1.Metadata["new_status"])
	}

	// 2. Add second source -> DEVELOPING
	p2 := &domain.PipelinePayload{
		PayloadID:       "pay-node-2",
		TenantID:        "tenant-XYZ",
		Content:         "Developing market alert story",
		ConfidenceScore: 0.80,
		Sources: []domain.Source{
			{SourceID: "s-2", Name: "Source 2"},
		},
		Metadata: map[string]string{
			"entities":   "Market,CentralBank,Rate",
			"event_name": "RateDecision2026",
			"topic_name": "MonetaryPolicy",
		},
	}
	res2, _ := agent.Operate(ctx, p2)
	if res2.Metadata["action"] != "UPDATED" || res2.Metadata["new_status"] != "DEVELOPING" {
		t.Fatalf("expected UPDATED / DEVELOPING, got %s / %s", res2.Metadata["action"], res2.Metadata["new_status"])
	}

	// 3. Add third source with confidence > 0.85 -> VERIFIED
	p3 := &domain.PipelinePayload{
		PayloadID:       "pay-node-3",
		TenantID:        "tenant-XYZ",
		Content:         "Verified market alert story",
		ConfidenceScore: 0.95,
		Sources: []domain.Source{
			{SourceID: "s-3", Name: "Source 3"},
		},
		Metadata: map[string]string{
			"entities":   "Market,CentralBank,Rate",
			"event_name": "RateDecision2026",
			"topic_name": "MonetaryPolicy",
		},
	}
	res3, _ := agent.Operate(ctx, p3)
	if res3.Metadata["new_status"] != "VERIFIED" {
		t.Fatalf("expected VERIFIED status for 3 sources with confidence > 0.85, got %s", res3.Metadata["new_status"])
	}
}

func TestStoryGraphUpdaterMergeDetectionAndReport(t *testing.T) {
	agent := NewStoryGraphUpdater(nil, nil, nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	// Story A
	pA := &domain.PipelinePayload{
		PayloadID:       "pay-A",
		TenantID:        "tenant-XYZ",
		Content:         "Story A on election update",
		ConfidenceScore: 0.80,
		Sources: []domain.Source{
			{SourceID: "src-A", Name: "Reporter A"},
		},
		Metadata: map[string]string{
			"entities":   "Election,Commission,Accra,Voters",
			"event_name": "ElectionUpdate2026",
		},
	}
	_, _ = agent.Operate(ctx, pA)

	// Story B with identical event_name and >0.85 entity overlap -> should merge into Story A
	pB := &domain.PipelinePayload{
		PayloadID:       "pay-B",
		TenantID:        "tenant-XYZ",
		Content:         "Story B on election update",
		ConfidenceScore: 0.90,
		Sources: []domain.Source{
			{SourceID: "src-B", Name: "Reporter B"},
		},
		Metadata: map[string]string{
			"entities":   "Election,Commission,Accra,Voters", // 100% overlap (> 0.85)
			"event_name": "ElectionUpdate2026",
		},
	}
	resMerge, err := agent.Operate(ctx, pB)
	if err != nil {
		t.Fatalf("unexpected error on merge candidate: %v", err)
	}
	if resMerge.Metadata["action"] != "MERGED" {
		t.Fatalf("expected action MERGED for >0.85 entity overlap on same event, got %s", resMerge.Metadata["action"])
	}
	if resMerge.TargetPipeline != "STORY_GRAPH:MERGE" {
		t.Fatalf("expected target pipeline STORY_GRAPH:MERGE, got %s", resMerge.TargetPipeline)
	}

	report, err := agent.Report(ctx, pB)
	if err != nil {
		t.Fatalf("unexpected error on Report: %v", err)
	}
	if report.Metrics["merges_detected"] != 1 {
		t.Fatalf("expected 1 merge detected in report metrics, got %v", report.Metrics["merges_detected"])
	}
}
