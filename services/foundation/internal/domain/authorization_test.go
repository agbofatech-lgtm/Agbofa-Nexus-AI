package domain

import "testing"

func TestPermissionMatchesWildcard(t *testing.T) {
	permission := Permission{Resource: "*", Action: "read"}
	if !permission.Matches("story", "READ") {
		t.Fatal("expected wildcard resource and case-insensitive action to match")
	}
}

func TestRolePolicyAllowsMatchingPermission(t *testing.T) {
	policy := RolePolicy{Permissions: []Permission{{Resource: "tenant", Action: "admin"}}}
	if !policy.Allows("TENANT", "ADMIN") {
		t.Fatal("expected matching role policy to allow action")
	}
}

func TestRolePolicyDeniesMissingPermission(t *testing.T) {
	policy := RolePolicy{Permissions: []Permission{{Resource: "tenant", Action: "read"}}}
	if policy.Allows("tenant", "delete") {
		t.Fatal("expected missing permission to deny action")
	}
}
