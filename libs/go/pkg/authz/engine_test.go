package authz

import "testing"

func TestCanonicalRolesAndIsolation(t *testing.T) {
	if Canonical("admin") != RoleTenantAdmin {
		t.Fatal("admin mapping")
	}
	allow := Decide(Request{SubjectID: "u", TenantID: "A", ResourceTenant: "A", Roles: []string{"EDITOR"}, Resource: "content", Action: "create"})
	if !allow.Allowed {
		t.Fatalf("expected allow: %+v", allow)
	}
	deny := Decide(Request{SubjectID: "u", TenantID: "A", ResourceTenant: "B", Roles: []string{"EDITOR"}, Resource: "content", Action: "create"})
	if deny.Allowed {
		t.Fatal("cross tenant must deny")
	}
	if Decide(Request{SubjectID: "u", TenantID: "", Roles: []string{"EDITOR"}, Resource: "content", Action: "read"}).Allowed {
		t.Fatal("missing tenant must deny")
	}
	if Decide(Request{SubjectID: "u", TenantID: "A", Roles: []string{"READER"}, Resource: "content", Action: "create"}).Allowed {
		t.Fatal("reader create must deny")
	}
}
