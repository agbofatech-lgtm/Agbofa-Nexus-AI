package pipeline

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestCompliancePreCheckerLifecycleAndTenantIsolation(t *testing.T) {
	agent := NewCompliancePreChecker(nil, nil, nil)
	ctx := context.Background()

	if agent.ID() != "AGT-028" || agent.Name() != "Compliance Pre-Checker" {
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

func TestCompliancePreChecker6FactorScanAndRouting(t *testing.T) {
	agent := NewCompliancePreChecker(nil, nil, nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	// 1. CLEARED -> CONTENT_FACTORY
	pClean := &domain.PipelinePayload{
		PayloadID:       "pay-comp-1",
		TenantID:        "tenant-XYZ",
		Content:         "Standard verified news report on quarterly trade figures.",
		ConfidenceScore: 0.95,
	}
	resClean, err := agent.Operate(ctx, pClean)
	if err != nil {
		t.Fatalf("unexpected error on clean payload: %v", err)
	}
	if resClean.TargetPipeline != "CONTENT_FACTORY" || resClean.Metadata["status"] != "CLEARED" {
		t.Fatalf("expected CONTENT_FACTORY / CLEARED, got %s / %s", resClean.TargetPipeline, resClean.Metadata["status"])
	}

	// 2. BLOCKED -> COMPLIANCE_HOLD (critical flag: embargo_violation)
	futureEmbargo := time.Now().Add(24 * time.Hour).Format(time.RFC3339)
	pEmbargo := &domain.PipelinePayload{
		PayloadID:       "pay-comp-2",
		TenantID:        "tenant-XYZ",
		Content:         "Embargoed earnings release data.",
		ConfidenceScore: 0.95,
		Metadata: map[string]string{
			"embargo_time": futureEmbargo,
		},
	}
	resBlocked, _ := agent.Operate(ctx, pEmbargo)
	if resBlocked.TargetPipeline != "COMPLIANCE_HOLD" || resBlocked.Metadata["status"] != "BLOCKED" {
		t.Fatalf("expected COMPLIANCE_HOLD / BLOCKED on embargo violation, got %s / %s", resBlocked.TargetPipeline, resBlocked.Metadata["status"])
	}

	// 3. FLAGGED -> COMPLIANCE_REVIEW (significant flag: unverified_allegations)
	pDefamation := &domain.PipelinePayload{
		PayloadID:       "pay-comp-3",
		TenantID:        "tenant-XYZ",
		Content:         "Report alleges that official embezzled funds without evidence.",
		ConfidenceScore: 0.75, // < 0.90
	}
	resFlagged, _ := agent.Operate(ctx, pDefamation)
	if resFlagged.TargetPipeline != "COMPLIANCE_REVIEW" || resFlagged.Metadata["status"] != "FLAGGED" {
		t.Fatalf("expected COMPLIANCE_REVIEW / FLAGGED, got %s / %s", resFlagged.TargetPipeline, resFlagged.Metadata["status"])
	}

	// Check mandatory behavioral policy flags
	if resClean.Metadata["suppression_policy"] != "NEVER_SUPPRESS_HUMAN_DECIDES" {
		t.Fatalf("missing mandatory NEVER_SUPPRESS_HUMAN_DECIDES suppression policy flag")
	}
	if resClean.Metadata["legal_disclaimer"] != "RISK_IDENTIFICATION_ONLY_NOT_LEGAL_ADVICE" {
		t.Fatalf("missing mandatory legal disclaimer flag")
	}
	if resClean.Metadata["flagging_bias"] != "CONSERVATIVE_ERR_ON_FLAGGING" {
		t.Fatalf("missing mandatory flagging bias flag")
	}
	if resBlocked.Metadata["remediation_steps"] == "" {
		t.Fatalf("expected remediation steps present on blocked content")
	}
}

func TestCompliancePreCheckerReportMetrics(t *testing.T) {
	agent := NewCompliancePreChecker(nil, nil, nil)
	ctx := context.Background()
	_ = agent.Initialize(ctx, "tenant-XYZ", nil)

	p := &domain.PipelinePayload{
		PayloadID:       "pay-comp-rep",
		TenantID:        "tenant-XYZ",
		Content:         "Clean factual report",
		ConfidenceScore: 0.95,
	}
	_, _ = agent.Operate(ctx, p)

	report, err := agent.Report(ctx, p)
	if err != nil {
		t.Fatalf("unexpected error on Report: %v", err)
	}
	if report.Metrics["total_screened"] != 1 {
		t.Fatalf("expected 1 total screened in metrics, got %v", report.Metrics["total_screened"])
	}
}
