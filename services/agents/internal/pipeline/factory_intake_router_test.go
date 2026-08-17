package pipeline

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestFactoryIntakeRouterLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewFactoryIntakeRouter(nil, nil, nil)
	ctx := context.Background()

	if agent.ID() != "AGT-027" || agent.Name() != "Factory Intake Router" {
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

func TestFactoryIntakeRouterOperateAndRouting(t *testing.T) {
	agent := NewFactoryIntakeRouter(nil, nil, nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	// 1. All assets ready + compatible brand voice -> CONTENT_FACTORY
	pReady := &domain.PipelinePayload{
		PayloadID:       "pay-pkg-1",
		TenantID:        "tenant-XYZ",
		Content:         "Short social post",
		ConfidenceScore: 0.95,
		ConfidenceTier:  "VERIFIED_TRUTH",
		Metadata: map[string]string{
			"package_type": "SOCIAL_POST",
			"assets_ready": "true",
		},
	}
	res1, err := agent.Operate(ctx, pReady)
	if err != nil {
		t.Fatalf("unexpected error on ready package: %v", err)
	}
	if res1.TargetPipeline != "CONTENT_FACTORY" {
		t.Fatalf("expected CONTENT_FACTORY, got %s", res1.TargetPipeline)
	}

	// 2. Missing required assets (ARTICLE without featured_image) -> ASSET_REQUEST
	pMissing := &domain.PipelinePayload{
		PayloadID:       "pay-pkg-2",
		TenantID:        "tenant-XYZ",
		Content:         "Long article content here...",
		ConfidenceScore: 0.95,
		ConfidenceTier:  "VERIFIED_TRUTH",
		Metadata: map[string]string{
			"package_type": "ARTICLE",
			// missing asset_featured_image and asset_seo_metadata
		},
	}
	res2, _ := agent.Operate(ctx, pMissing)
	if res2.TargetPipeline != "ASSET_REQUEST" {
		t.Fatalf("expected ASSET_REQUEST when required assets are missing, got %s", res2.TargetPipeline)
	}

	// 3. Brand voice tone mismatch -> EDITORIAL_REVIEW
	pMismatch := &domain.PipelinePayload{
		PayloadID:       "pay-pkg-3",
		TenantID:        "tenant-XYZ",
		Content:         "Social post with casual tone",
		ConfidenceScore: 0.95,
		ConfidenceTier:  "VERIFIED_TRUTH",
		Metadata: map[string]string{
			"package_type":         "SOCIAL_POST",
			"assets_ready":         "true",
			"brand_voice_mismatch": "true",
		},
	}
	res3, _ := agent.Operate(ctx, pMismatch)
	if res3.TargetPipeline != "EDITORIAL_REVIEW" {
		t.Fatalf("expected EDITORIAL_REVIEW on tone mismatch, got %s", res3.TargetPipeline)
	}
}

func TestFactoryIntakeRouterReportMetrics(t *testing.T) {
	agent := NewFactoryIntakeRouter(nil, nil, nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	p := &domain.PipelinePayload{
		PayloadID:       "pay-report",
		TenantID:        "tenant-XYZ",
		ConfidenceScore: 0.95,
		Metadata:        map[string]string{"assets_ready": "true"},
	}
	_, _ = agent.Operate(ctx, p)

	report, err := agent.Report(ctx, p)
	if err != nil {
		t.Fatalf("unexpected error on Report: %v", err)
	}
	if report.Metrics["packages_routed"] != 1 {
		t.Fatalf("expected 1 package routed in metrics, got %v", report.Metrics["packages_routed"])
	}
}
