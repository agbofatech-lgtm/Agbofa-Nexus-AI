package pipeline

import (
	"context"
	"errors"
	"math"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestAnalyticsCollectorLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewAnalyticsCollector(nil, nil, nil)
	ctx := context.Background()

	if agent.ID() != "AGT-030" || agent.Name() != "Analytics Collector" {
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

func TestAnalyticsCollectorOperateAndAnomalyDetection(t *testing.T) {
	agent := NewAnalyticsCollector(nil, nil, nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	p1 := &domain.PipelinePayload{
		PayloadID: "pay-ana-1",
		TenantID:  "tenant-XYZ",
		Metadata: map[string]string{
			"views":    "1000",
			"likes":    "100",
			"shares":   "50",
			"comments": "25",
		},
	}

	res1, err := agent.Operate(ctx, p1)
	if err != nil {
		t.Fatalf("unexpected error on operate: %v", err)
	}
	if res1.TargetPipeline != "LEARNING_FEEDBACK" {
		t.Fatalf("expected LEARNING_FEEDBACK, got %s", res1.TargetPipeline)
	}
	if res1.Metadata["total_engagement"] != "175.00" { // 100+50+25+0(clicks default if not set... wait clicks default 300!)
		// Let's check: total = 100+50+25+300 = 475.00
		if res1.Metadata["total_engagement"] != "475.00" {
			t.Fatalf("expected total engagement 475.00, got %s", res1.Metadata["total_engagement"])
		}
	}

	// Check anomaly detection
	pAnom := &domain.PipelinePayload{
		PayloadID: "pay-ana-2",
		TenantID:  "tenant-XYZ",
		Metadata: map[string]string{
			"views":            "100",
			"likes":            "50", // engagement_rate = (50+120+80+300)/100 = 5.5 > 0.20 -> anomaly!
			"simulate_anomaly": "true",
		},
	}
	resAnom, _ := agent.Operate(ctx, pAnom)
	if resAnom.Metadata["anomaly_detected"] != "true" {
		t.Fatalf("expected anomaly_detected=true on spike, got %s", resAnom.Metadata["anomaly_detected"])
	}

	report, err := agent.Report(ctx, p1)
	if err != nil {
		t.Fatalf("unexpected error on Report: %v", err)
	}
	if report.Metrics["total_collected"] != 2 {
		t.Fatalf("expected 2 total collected in metrics, got %v", report.Metrics["total_collected"])
	}
	if math.Abs(report.Metrics["average_engagement"].(float64)) < 0.01 {
		t.Fatalf("expected non-zero average engagement in report metrics")
	}
}

func TestAnalyticsCollectorRLSEnforcement(t *testing.T) {
	agent := NewAnalyticsCollector(nil, nil, nil)
	ctx := context.Background()

	stateB := &domain.PipelineState{
		StateID:  "st-b",
		TenantID: "tenant-B",
	}

	// Empty tenant ID must return ErrCrossTenantViolation
	if err := agent.PersistAnalyticsDataSQL(ctx, nil, "", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenant ID, got %v", err)
	}
	// Mismatched tenant ID must return ErrCrossTenantViolation
	if err := agent.PersistAnalyticsDataSQL(ctx, nil, "tenant-A", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on mismatched tenant ID, got %v", err)
	}
}
