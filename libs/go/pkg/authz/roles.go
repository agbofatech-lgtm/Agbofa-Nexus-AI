package authz

import "strings"

const (
	RoleTenantOwner = "TENANT_OWNER"
	RoleTenantAdmin = "TENANT_ADMIN"
	RoleEditor      = "EDITOR"
	RoleAnalyst     = "ANALYST"
	RoleReader      = "READER"
)

// Canonical maps leftover UI vocabulary onto the Phase 01 role model.
func Canonical(role string) string {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "owner", "tenant_owner", "tenant-owner":
		return RoleTenantOwner
	case "admin", "tenant_admin", "tenant-admin":
		return RoleTenantAdmin
	case "editor":
		return RoleEditor
	case "analyst":
		return RoleAnalyst
	case "reader", "viewer":
		return RoleReader
	default:
		return strings.ToUpper(strings.TrimSpace(role))
	}
}

func IsCanonical(role string) bool {
	switch Canonical(role) {
	case RoleTenantOwner, RoleTenantAdmin, RoleEditor, RoleAnalyst, RoleReader:
		return true
	default:
		return false
	}
}
