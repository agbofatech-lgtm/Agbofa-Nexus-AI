package application_test

import (
	"context"
	"testing"
	"time"

	"github.com/agbofa/nexus/services/runtime/internal/application"
	"github.com/agbofa/nexus/services/runtime/internal/domain"
)

func TestGovernanceService_ValidateConstitution(t *testing.T) {
	svc := application.NewGovernanceService(nil)
	ok, violations, err := svc.ValidateConstitution(context.Background(), "IMP-006", []string{"IMP-001", "IMP-005", "IMP-006"})
	if err != nil || !ok || len(violations) > 0 {
		t.Fatalf("expected constitution check to pass, got ok=%v err=%v", ok, err)
	}

	ok, violations, err = svc.ValidateConstitution(context.Background(), "IMP-006", []string{"IMP-001", "IMP-006", "IMP-007"})
	if err == nil || ok || len(violations) == 0 {
		t.Fatalf("expected constitution check to fail for IMP-007, got ok=%v err=%v", ok, err)
	}
}

func TestGovernanceService_VerifyPlaybook(t *testing.T) {
	svc := application.NewGovernanceService(nil)
	pl := domain.PlaybookChecklist{
		PlaybookID: "PB-006",
		UnitID:     "IMP-006",
		Items: map[string]bool{
			"schema_validation_passed": true,
			"no_unauthorized_scope":    true,
		},
		VerifiedBy: "automation",
		VerifiedAt: time.Now(),
	}

	ok, missing, err := svc.VerifyPlaybook(context.Background(), pl, []string{"schema_validation_passed", "no_unauthorized_scope"})
	if err != nil || !ok || len(missing) > 0 {
		t.Fatalf("expected playbook verification to pass, got ok=%v missing=%v", ok, missing)
	}

	ok, missing, err = svc.VerifyPlaybook(context.Background(), pl, []string{"schema_validation_passed", "no_unauthorized_scope", "security_review_passed"})
	if err != nil || ok || len(missing) != 1 {
		t.Fatalf("expected playbook verification to fail with 1 missing item, got ok=%v missing=%v", ok, missing)
	}
}
