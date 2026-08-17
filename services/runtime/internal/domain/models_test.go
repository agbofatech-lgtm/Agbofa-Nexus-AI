package domain_test

import (
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/runtime/internal/domain"
)

func TestAIGatewayPolicy_AllowsModel(t *testing.T) {
	policy := domain.AIGatewayPolicy{
		TenantID:      "tenant-001",
		AllowedModels: []string{"gpt-4", "claude-3"},
	}
	if !policy.AllowsModel("gpt-4") {
		t.Fatalf("expected gpt-4 to be allowed")
	}
	if policy.AllowsModel("unauthorized-model") {
		t.Fatalf("expected unauthorized-model to be disallowed")
	}

	wildcard := domain.AIGatewayPolicy{
		TenantID:      "tenant-002",
		AllowedModels: []string{"*"},
	}
	if !wildcard.AllowsModel("any-model") {
		t.Fatalf("expected wildcard to allow any-model")
	}
}

func TestAgentExecutionPolicy_ValidateTool(t *testing.T) {
	policy := domain.AgentExecutionPolicy{
		AllowedTools: map[string]bool{
			"search_docs": true,
			"calculator":  true,
		},
	}
	if err := policy.ValidateTool("search_docs"); err != nil {
		t.Fatalf("expected search_docs to be allowed, got %v", err)
	}
	if err := policy.ValidateTool("drop_database"); !errors.Is(err, domain.ErrUnauthorizedTool) {
		t.Fatalf("expected ErrUnauthorizedTool, got %v", err)
	}
}

func TestValidateConstitutionScope(t *testing.T) {
	valid := []string{"IMP-001", "IMP-002", "IMP-003", "IMP-004", "IMP-005", "IMP-006"}
	if err := domain.ValidateConstitutionScope("IMP-006", valid); err != nil {
		t.Fatalf("expected valid units to pass, got %v", err)
	}

	invalid := []string{"IMP-001", "IMP-006", "IMP-007"}
	if err := domain.ValidateConstitutionScope("IMP-006", invalid); !errors.Is(err, domain.ErrUnauthorizedScopeDetected) {
		t.Fatalf("expected ErrUnauthorizedScopeDetected for IMP-007, got %v", err)
	}
}

func TestVerifyPlaybookChecklist(t *testing.T) {
	pl := domain.PlaybookChecklist{
		PlaybookID: "PB-006",
		UnitID:     "IMP-006",
		Items: map[string]bool{
			"code_review_passed": true,
			"tests_passing":      true,
		},
		VerifiedBy: "test-user",
		VerifiedAt: time.Now(),
	}
	missing, ok := domain.VerifyPlaybookChecklist(pl, []string{"code_review_passed", "tests_passing"})
	if !ok || len(missing) != 0 {
		t.Fatalf("expected checklist to pass, got missing: %v", missing)
	}

	missing, ok = domain.VerifyPlaybookChecklist(pl, []string{"code_review_passed", "tests_passing", "security_audit_passed"})
	if ok || len(missing) != 1 {
		t.Fatalf("expected checklist to fail with 1 missing item, got ok=%v, missing=%v", ok, missing)
	}
}
