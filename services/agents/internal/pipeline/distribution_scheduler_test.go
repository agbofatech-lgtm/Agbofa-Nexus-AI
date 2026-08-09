package pipeline

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestDistributionSchedulerLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewDistributionScheduler(nil, nil, nil)
	ctx := context.Background()

	if agent.ID() != "AGT-029" || agent.Name() != "Distribution Scheduler" {
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

func TestDistributionSchedulerOperateAndEmbargoEnforcement(t *testing.T) {
	agent := NewDistributionScheduler(nil, nil, nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	// 1. BREAKING priority -> DISTRIBUTION:IMMEDIATE
	pBreaking := &domain.PipelinePayload{
		PayloadID: "pay-dist-1",
		TenantID:  "tenant-XYZ",
		Metadata: map[string]string{
			"priority": "BREAKING",
			"channels": "TWITTER,LINKEDIN",
		},
	}
	res1, err := agent.Operate(ctx, pBreaking)
	if err != nil {
		t.Fatalf("unexpected error on breaking distribution: %v", err)
	}
	if res1.TargetPipeline != "DISTRIBUTION:IMMEDIATE" || res1.Metadata["schedule_slot"] != "IMMEDIATE" {
		t.Fatalf("expected IMMEDIATE slot, got %s / %s", res1.TargetPipeline, res1.Metadata["schedule_slot"])
	}

	// 2. Embargoed content -> DISTRIBUTION:EMBARGOED
	embargoTime := time.Now().Add(12 * time.Hour).Format(time.RFC3339)
	pEmbargo := &domain.PipelinePayload{
		PayloadID: "pay-dist-2",
		TenantID:  "tenant-XYZ",
		Metadata: map[string]string{
			"embargo_time": embargoTime,
			"channels":     "TWITTER,LINKEDIN,FACEBOOK",
		},
	}
	res2, _ := agent.Operate(ctx, pEmbargo)
	if res2.TargetPipeline != "DISTRIBUTION:EMBARGOED" || res2.Metadata["embargo_enforced"] != "true" {
		t.Fatalf("expected EMBARGOED slot with embargo_enforced=true, got %s / %s", res2.TargetPipeline, res2.Metadata["embargo_enforced"])
	}
	if res2.Metadata["embargo_lift_time"] != embargoTime {
		t.Fatalf("expected embargo lift time %s, got %s", embargoTime, res2.Metadata["embargo_lift_time"])
	}

	// 3. Standard release -> DISTRIBUTION:SCHEDULED
	pStd := &domain.PipelinePayload{
		PayloadID: "pay-dist-3",
		TenantID:  "tenant-XYZ",
	}
	res3, _ := agent.Operate(ctx, pStd)
	if res3.TargetPipeline != "DISTRIBUTION:SCHEDULED" {
		t.Fatalf("expected DISTRIBUTION:SCHEDULED, got %s", res3.TargetPipeline)
	}
}

func TestDistributionSchedulerRLSEnforcement(t *testing.T) {
	agent := NewDistributionScheduler(nil, nil, nil)
	ctx := context.Background()

	stateB := &domain.PipelineState{
		StateID:  "st-b",
		TenantID: "tenant-B",
	}

	// Empty tenant ID must return ErrCrossTenantViolation
	if err := agent.PersistDistributionScheduleSQL(ctx, nil, "", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenant ID, got %v", err)
	}
	// Mismatched tenant ID must return ErrCrossTenantViolation
	if err := agent.PersistDistributionScheduleSQL(ctx, nil, "tenant-A", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on mismatched tenant ID, got %v", err)
	}
}
