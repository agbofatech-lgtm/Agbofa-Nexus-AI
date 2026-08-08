package domain

import "strings"

type Permission struct {
	Resource string
	Action   string
}

type RolePolicy struct {
	ID          string
	TenantID    string
	Role        string
	Permissions []Permission
}

type AuthorizationRequest struct {
	TenantID  string
	SubjectID string
	Roles     []string
	Resource  string
	Action    string
	Context   map[string]string
}

type AuthorizationDecision struct {
	Allowed  bool
	Reason   string
	PolicyID string
}

func (p Permission) Matches(resource string, action string) bool {
	resourceMatch := p.Resource == "*" || strings.EqualFold(p.Resource, resource)
	actionMatch := p.Action == "*" || strings.EqualFold(p.Action, action)
	return resourceMatch && actionMatch
}

func (p RolePolicy) Allows(resource string, action string) bool {
	for _, permission := range p.Permissions {
		if permission.Matches(resource, action) {
			return true
		}
	}
	return false
}
