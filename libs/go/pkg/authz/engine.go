package authz

import (
	"context"
	"errors"
	"strings"
)

var (
	ErrDenied         = errors.New("authorization denied")
	ErrMissingTenant  = errors.New("missing tenant")
	ErrInvalidTenant  = errors.New("invalid tenant")
	ErrCrossTenant    = errors.New("cross-tenant access denied")
	ErrMissingSubject = errors.New("missing subject")
)

type Request struct {
	SubjectID      string
	TenantID       string
	ResourceTenant string
	Roles          []string
	Resource       string
	Action         string
	Scope          string
}

type Decision struct {
	Allowed bool
	Reason  string
}

// Decide evaluates subject + tenant + role + resource + action + scope.
// Client-supplied tenant IDs that do not match the authenticated tenant are denied.
func Decide(req Request) Decision {
	if strings.TrimSpace(req.SubjectID) == "" {
		return Decision{Allowed: false, Reason: ErrMissingSubject.Error()}
	}
	if strings.TrimSpace(req.TenantID) == "" {
		return Decision{Allowed: false, Reason: ErrMissingTenant.Error()}
	}
	if req.ResourceTenant != "" && req.ResourceTenant != req.TenantID {
		return Decision{Allowed: false, Reason: ErrCrossTenant.Error()}
	}
	for _, role := range req.Roles {
		if allows(Canonical(role), req.Resource, req.Action, req.Scope) {
			return Decision{Allowed: true, Reason: "role permits action"}
		}
	}
	return Decision{Allowed: false, Reason: "no matching permission"}
}

func allows(role, resource, action, scope string) bool {
	_ = scope
	switch role {
	case RoleTenantOwner:
		return true
	case RoleTenantAdmin:
		return !strings.EqualFold(resource, "billing")
	case RoleEditor:
		if strings.EqualFold(resource, "autonomy") && strings.EqualFold(action, "control") {
			return false
		}
		return strings.EqualFold(resource, "content") || strings.EqualFold(resource, "newsroom") ||
			strings.EqualFold(resource, "memory") || strings.EqualFold(resource, "scenario") ||
			strings.EqualFold(resource, "autonomy") || strings.EqualFold(resource, "cost")
	case RoleAnalyst:
		return strings.EqualFold(resource, "analytics") || strings.EqualFold(resource, "cost") ||
			strings.EqualFold(action, "read")
	case RoleReader:
		return strings.EqualFold(action, "read")
	default:
		return false
	}
}

type ctxKey struct{}

type Principal struct {
	SubjectID string
	TenantID  string
	Roles     []string
}

func WithPrincipal(ctx context.Context, p Principal) context.Context {
	return context.WithValue(ctx, ctxKey{}, p)
}

func PrincipalFrom(ctx context.Context) (Principal, bool) {
	p, ok := ctx.Value(ctxKey{}).(Principal)
	return p, ok && p.SubjectID != "" && p.TenantID != ""
}
