package application

import (
	"context"
	"fmt"

	"github.com/agbofa/nexus/services/foundation/internal/domain"
)

type PolicyRepository interface {
	FindPoliciesForRoles(ctx context.Context, tenantID string, roles []string) ([]domain.RolePolicy, error)
}

type AuthorizationAuditLogger interface {
	RecordDecision(ctx context.Context, request domain.AuthorizationRequest, decision domain.AuthorizationDecision) error
}

type AuthorizationService struct {
	policies PolicyRepository
	audit    AuthorizationAuditLogger
}

func NewAuthorizationService(policies PolicyRepository, audit AuthorizationAuditLogger) *AuthorizationService {
	return &AuthorizationService{policies: policies, audit: audit}
}

func (s *AuthorizationService) CheckPermission(ctx context.Context, request domain.AuthorizationRequest) (domain.AuthorizationDecision, error) {
	policies, err := s.policies.FindPoliciesForRoles(ctx, request.TenantID, request.Roles)
	if err != nil {
		return domain.AuthorizationDecision{}, fmt.Errorf("find policies for roles: %w", err)
	}
	for _, policy := range policies {
		if policy.Allows(request.Resource, request.Action) {
			decision := domain.AuthorizationDecision{Allowed: true, Reason: "matched role policy", PolicyID: policy.ID}
			if err := s.audit.RecordDecision(ctx, request, decision); err != nil {
				return domain.AuthorizationDecision{}, fmt.Errorf("record authorization decision: %w", err)
			}
			return decision, nil
		}
	}
	decision := domain.AuthorizationDecision{Allowed: false, Reason: "no matching policy"}
	if err := s.audit.RecordDecision(ctx, request, decision); err != nil {
		return domain.AuthorizationDecision{}, fmt.Errorf("record authorization decision: %w", err)
	}
	return decision, nil
}
