package pipeline

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestPipelineRepositoryRLSEnforcement(t *testing.T) {
	repo := NewPipelineRepository(nil)
	ctx := context.Background()

	stateA := &domain.PipelineState{
		StateID:      "st-001",
		TenantID:     "tenant-A",
		AgentID:      "AGT-025",
		CurrentStage: domain.PipelineStageIngestion,
		LastStatus:   domain.PipelineStatusSuccess,
		LastUpdated:  time.Now(),
	}

	stateB := &domain.PipelineState{
		StateID:      "st-002",
		TenantID:     "tenant-B",
		AgentID:      "AGT-025",
		CurrentStage: domain.PipelineStageIngestion,
		LastStatus:   domain.PipelineStatusSuccess,
		LastUpdated:  time.Now(),
	}

	// 1. Missing or empty tenant context causes the operation to fail closed
	if err := repo.SavePipelineState(ctx, "", stateA); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID on SavePipelineState, got %v", err)
	}
	if _, err := repo.GetPipelineState(ctx, "", "st-001"); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID on GetPipelineState, got %v", err)
	}
	if err := repo.UpdatePipelineState(ctx, "", stateA); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID on UpdatePipelineState, got %v", err)
	}
	if err := repo.DeletePipelineState(ctx, "", "st-001"); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenantID on DeletePipelineState, got %v", err)
	}

	// 2. Tenant A cannot insert rows with Tenant B's tenant_id
	if err := repo.SavePipelineState(ctx, "tenant-A", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation when Tenant A attempts to save Tenant B's state, got %v", err)
	}

	// 3. Tenant A cannot update Tenant B's data
	if err := repo.UpdatePipelineState(ctx, "tenant-A", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation when Tenant A attempts to update Tenant B's state, got %v", err)
	}

	// 4. Audit entries fail closed on cross-tenant mismatch or empty tenantID
	entryB := &domain.PipelineAuditEntry{
		AuditID:     "audit-001",
		TenantID:    "tenant-B",
		ExecutionID: "exec-001",
		AgentID:     "AGT-025",
	}
	if err := repo.SaveAuditEntry(ctx, "tenant-A", entryB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation when saving cross-tenant audit entry, got %v", err)
	}
	if _, err := repo.ListAuditEntries(ctx, "", "exec-001"); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenant on ListAuditEntries, got %v", err)
	}

	// 5. Feedback signals fail closed on cross-tenant mismatch or empty tenantID
	sigB := &domain.FeedbackSignal{
		SignalID:    "sig-001",
		TenantID:    "tenant-B",
		TargetAgent: "AGT-025",
	}
	if err := repo.SaveFeedbackSignal(ctx, "tenant-A", sigB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation when saving cross-tenant feedback signal, got %v", err)
	}
	if _, err := repo.ListFeedbackSignals(ctx, "", "AGT-025"); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation for empty tenant on ListFeedbackSignals, got %v", err)
	}
}

func TestPipelineAgentSQLPersistenceRLSEnforcement(t *testing.T) {
	ctx := context.Background()

	agt25 := NewIngestionOrchestrator(nil, nil)
	agt26 := NewStoryGraphUpdater(nil, nil, nil)
	agt27 := NewFactoryIntakeRouter(nil, nil, nil)
	agt28 := NewCompliancePreChecker(nil, nil, nil)

	stateB := &domain.PipelineState{
		StateID:  "st-b",
		TenantID: "tenant-B",
	}

	// Proves that any attempt to persist SQL state with empty tenant ID or mismatched tenant ID fails closed
	if err := agt25.PersistStateSQL(ctx, nil, "", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("AGT-025 expected ErrCrossTenantViolation on empty tenant ID, got %v", err)
	}
	if err := agt25.PersistStateSQL(ctx, nil, "tenant-A", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("AGT-025 expected ErrCrossTenantViolation on mismatched tenant ID, got %v", err)
	}

	if err := agt26.PersistStateSQL(ctx, nil, "", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("AGT-026 expected ErrCrossTenantViolation on empty tenant ID, got %v", err)
	}
	if err := agt26.PersistStateSQL(ctx, nil, "tenant-A", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("AGT-026 expected ErrCrossTenantViolation on mismatched tenant ID, got %v", err)
	}

	if err := agt27.PersistStateSQL(ctx, nil, "", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("AGT-027 expected ErrCrossTenantViolation on empty tenant ID, got %v", err)
	}
	if err := agt27.PersistStateSQL(ctx, nil, "tenant-A", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("AGT-027 expected ErrCrossTenantViolation on mismatched tenant ID, got %v", err)
	}

	if err := agt28.PersistStateSQL(ctx, nil, "", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("AGT-028 expected ErrCrossTenantViolation on empty tenant ID, got %v", err)
	}
	if err := agt28.PersistStateSQL(ctx, nil, "tenant-A", stateB); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("AGT-028 expected ErrCrossTenantViolation on mismatched tenant ID, got %v", err)
	}
}
