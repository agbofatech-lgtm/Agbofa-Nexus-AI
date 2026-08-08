package application

import (
	"context"

	"github.com/agbofa/nexus/services/runtime/internal/domain"
)

type GovernanceService struct {
	audit AuditLogger
}

func NewGovernanceService(audit AuditLogger) *GovernanceService {
	return &GovernanceService{audit: audit}
}

func (s *GovernanceService) ValidateConstitution(
	ctx context.Context,
	unitID string,
	detectedUnits []string,
) (bool, []string, error) {
	if err := domain.ValidateConstitutionScope(unitID, detectedUnits); err != nil {
		if s.audit != nil {
			_ = s.audit.LogEvent(ctx, "system", "constitution_violation", unitID, err.Error())
		}
		return false, []string{err.Error()}, err
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, "system", "constitution_compliance_pass", unitID, "no unauthorized scope detected")
	}
	return true, nil, nil
}

func (s *GovernanceService) VerifyPlaybook(
	ctx context.Context,
	playbook domain.PlaybookChecklist,
	requiredItems []string,
) (bool, []string, error) {
	missing, pass := domain.VerifyPlaybookChecklist(playbook, requiredItems)
	if !pass {
		if s.audit != nil {
			_ = s.audit.LogEvent(ctx, "system", "playbook_verification_failed", playbook.UnitID, "missing checklist items")
		}
		return false, missing, nil
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, "system", "playbook_verification_pass", playbook.UnitID, "all checklist items verified")
	}
	return true, nil, nil
}
