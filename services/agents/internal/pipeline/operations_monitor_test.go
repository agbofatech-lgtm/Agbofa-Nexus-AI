package pipeline

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestOperationsMonitorLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewOperationsMonitor(nil, nil, nil)
	ctx := context.Background()

	if agent.ID() != "AGT-032" || agent.Name() != "Operations Monitor" {
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

func TestOperationsMonitorOperateAndAlerts(t *testing.T) {
	agent := NewOperationsMonitor(nil, nil, nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	// 1. Nominal -> OPS_DASHBOARD
	p1 := &domain.PipelinePayload{
		PayloadID: "pay-ops-1",
		TenantID:  "tenant-XYZ",
	}
	res1, err := agent.Operate(ctx, p1)
	if err != nil {
		t.Fatalf("unexpected error on nominal operate: %v", err)
	}
	if res1.TargetPipeline != "OPS_DASHBOARD" || res1.Metadata["alert_severity"] != "NONE" {
		t.Fatalf("expected OPS_DASHBOARD / NONE, got %s / %s", res1.TargetPipeline, res1.Metadata["alert_severity"])
	}

	// 2. Simulate warning -> WARNING alert
	pWarn := &domain.PipelinePayload{
		PayloadID: "pay-ops-2",
		TenantID:  "tenant-XYZ",
		Metadata: map[string]string{
			"simulate_warning": "true",
		},
	}
	resWarn, _ := agent.Operate(ctx, pWarn)
	if resWarn.Metadata["alert_severity"] != "WARNING" {
		t.Fatalf("expected WARNING alert severity, got %s", resWarn.Metadata["alert_severity"])
	}

	// 3. Simulate critical -> CRITICAL alert + OPS_ALERT
	pCrit := &domain.PipelinePayload{
		PayloadID: "pay-ops-3",
		TenantID:  "tenant-XYZ",
		Metadata: map[string]string{
			"simulate_critical": "true",
		},
	}
	resCrit, _ := agent.Operate(ctx, pCrit)
	if resCrit.TargetPipeline != "OPS_ALERT" || resCrit.Metadata["alert_severity"] != "CRITICAL" {
		t.Fatalf("expected OPS_ALERT / CRITICAL, got %s / %s", resCrit.TargetPipeline, resCrit.Metadata["alert_severity"])
	}

	report, err := agent.Report(ctx, p1)
	if err != nil {
		t.Fatalf("unexpected error on Report: %v", err)
	}
	if report.Metrics["active_alerts"] != 1 {
		t.Fatalf("expected 1 active alert in report metrics, got %v", report.Metrics["active_alerts"])
	}
	if report.Metrics["average_uptime"].(float64) < 90.0 {
		t.Fatalf("expected average uptime > 90%% in report metrics")
	}
}

func TestOperationsMonitorRLSEnforcement(t *testing.T) {
	agent := NewOperationsMonitor(nil, nil, nil)
	ctx := context.Background()

	entryB := &domain.PipelineAuditEntry{
		AuditID:  "audit-b",
		TenantID: "tenant-B",
	}

	// Empty tenant ID must return ErrCrossTenantViolation
	if err := agent.PersistOperationsAuditSQL(ctx, nil, "", entryB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenant ID, got %v", err)
	}
	// Mismatched tenant ID must return ErrCrossTenantViolation
	if err := agent.PersistOperationsAuditSQL(ctx, nil, "tenant-A", entryB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on mismatched tenant ID, got %v", err)
	}
}
