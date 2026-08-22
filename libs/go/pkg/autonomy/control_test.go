package autonomy

import (
	"testing"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
)

func admin() authz.Principal {
	return authz.Principal{SubjectID: "admin-1", TenantID: "tenant-a", Roles: []string{authz.RoleTenantAdmin}}
}

func reader() authz.Principal {
	return authz.Principal{SubjectID: "r", TenantID: "tenant-a", Roles: []string{authz.RoleReader}}
}

func TestRegistryUniqueAndNotCertified(t *testing.T) {
	if !UniqueAgentIDs() {
		t.Fatal("ids")
	}
	if len(CanonicalAgents()) != 28 {
		t.Fatalf("want 28 got %d", len(CanonicalAgents()))
	}
	for _, a := range CanonicalAgents() {
		if a.Certified || a.Enabled {
			t.Fatalf("declared agent must not be certified or enabled: %s", a.ID)
		}
	}
}

func TestResolveDenials(t *testing.T) {
	p := NewPlane()
	if err := p.Enable("tenant-a", "AGT-026", admin()); err != nil {
		t.Fatal(err)
	}
	if _, m, err := p.Resolve("AGT-026", admin()); err != nil || m != MaturityExecutable {
		t.Fatalf("%s %v", m, err)
	}
	if _, _, err := p.Resolve("AGT-999", admin()); err == nil {
		t.Fatal("invalid")
	}
	if _, _, err := p.Resolve("AGT-001", admin()); err == nil {
		t.Fatal("declared")
	}
	if _, _, err := p.Resolve("AGT-026", reader()); err == nil {
		t.Fatal("reader")
	}
	other := admin()
	other.TenantID = "tenant-b"
	if _, _, err := p.Resolve("AGT-026", other); err == nil {
		t.Fatal("other tenant")
	}
}

func TestExecuteObserveAndForbidden(t *testing.T) {
	p := NewPlane()
	_ = p.Enable("tenant-a", "AGT-026", admin())
	ex := p.Execute(ExecRequest{AgentID: "AGT-026", Actor: admin()})
	if ex.Status != StatusSucceeded {
		t.Fatalf("%+v", ex)
	}
	if ex.Result["provider_called"] != false {
		t.Fatal("must not claim provider")
	}
	bad := p.Execute(ExecRequest{AgentID: "AGT-026", Actor: admin(), Tools: []ToolStep{{ToolID: "direct_social_api"}}})
	if bad.Status != StatusFailed || bad.Error != "FORBIDDEN_TOOL" {
		t.Fatalf("%+v", bad)
	}
}

func TestKillAndProductionDisabled(t *testing.T) {
	p := NewPlane()
	_ = p.Enable("tenant-a", "AGT-014", admin())
	_ = p.SetKill("tenant-a", admin(), true)
	ex := p.Execute(ExecRequest{AgentID: "AGT-014", Actor: admin()})
	if ex.Status != StatusBlocked || ex.Error != "KILL_SWITCH_ENGAGED" {
		t.Fatalf("%+v", ex)
	}
	_ = p.SetKill("tenant-a", admin(), false)
	pub := p.Execute(ExecRequest{
		AgentID: "AGT-014", Actor: admin(), Truth: true, Compliance: true, Brand: true,
		Tools: []ToolStep{{ToolID: "publish_content", Input: map[string]any{"tenant_id": "tenant-a", "content_id": "c", "body": TruthSafeFixture, "brand_identity_applied": true}}},
	})
	if pub.Error != "PRODUCTION_AUTONOMY_DISABLED" && pub.Status != StatusBlocked && pub.Status != StatusWaitingApproval {
		t.Fatalf("production must remain disabled: %+v", pub)
	}
	if p.Production {
		t.Fatal("default production must be false")
	}
}

func TestPublishUsesPhase04Only(t *testing.T) {
	p := NewPlane()
	p.Production = true
	called := 0
	p.Phase04 = func(tenant, actor, contentID, body string, brand bool) (string, error) {
		called++
		if !brand {
			t.Fatal("brand")
		}
		return "job-1", nil
	}
	_ = p.Enable("tenant-a", "AGT-014", admin())
	waiting := p.Execute(ExecRequest{
		AgentID: "AGT-014", Actor: admin(), Truth: true, Compliance: true, Brand: true,
		Tools: []ToolStep{{ToolID: "publish_content", Input: map[string]any{"content_id": "c1", "brand_identity_applied": true, "body": TruthSafeFixture}}},
	})
	if waiting.Status != StatusWaitingApproval {
		t.Fatalf("%+v", waiting)
	}
}

func TestIdempotency(t *testing.T) {
	p := NewPlane()
	_ = p.Enable("tenant-a", "AGT-026", admin())
	a := p.Execute(ExecRequest{AgentID: "AGT-026", Actor: admin(), IdempotencyKey: "k"})
	b := p.Execute(ExecRequest{AgentID: "AGT-026", Actor: admin(), IdempotencyKey: "k"})
	if a.ID != b.ID {
		t.Fatal("idem")
	}
}

func TestTruthFailBlocksPublish(t *testing.T) {
	p := NewPlane()
	p.Production = true
	_ = p.Enable("tenant-a", "AGT-014", admin())
	ex := p.Execute(ExecRequest{
		AgentID: "AGT-014", Actor: admin(), Brand: true,
		Tools: []ToolStep{{ToolID: "publish_content", Input: map[string]any{"content_id": "c", "body": "the earth is flat", "brand_identity_applied": true}}},
	})
	if ex.Status != StatusBlocked || ex.Error != "TRUTH_FAILED" {
		t.Fatalf("%+v", ex)
	}
}

func TestComplianceFailBlocksPublish(t *testing.T) {
    p := NewPlane()
    p.Production = true
    // Ensure Truth engine passes so that Compliance failure is isolated
    p.Truth = func(text string) (bool, error) { return true, nil }
    p.Compliance = func(text string) (bool, error) { return false, nil }
    _ = p.Enable("tenant-a", "AGT-014", admin())
    ex := p.Execute(ExecRequest{
        AgentID: "AGT-014", Actor: admin(), Brand: true,
        Tools: []ToolStep{{ToolID: "publish_content", Input: map[string]any{"content_id": "c", "body": "contact person@example.com", "brand_identity_applied": true}}},
    })
    if ex.Status != StatusBlocked || ex.Error != "COMPLIANCE_FAILED" {
        t.Fatalf("%+v", ex)
    }
}
func TestTruthUnavailableBlocksPublish(t *testing.T) {
	p := NewPlane()
	p.Production = true
	p.Truth = nil
	_ = p.Enable("tenant-a", "AGT-014", admin())
	ex := p.Execute(ExecRequest{
		AgentID: "AGT-014", Actor: admin(), Brand: true,
		Tools: []ToolStep{{ToolID: "publish_content", Input: map[string]any{"content_id": "c", "body": TruthSafeFixture, "brand_identity_applied": true}}},
	})
	if ex.Status != StatusBlocked || ex.Error != "TRUTH_UNAVAILABLE" {
		t.Fatalf("%+v", ex)
	}
}

func TestBypassTruthToolDenied(t *testing.T) {
	p := NewPlane()
	_ = p.Enable("tenant-a", "AGT-026", admin())
	ex := p.Execute(ExecRequest{AgentID: "AGT-026", Actor: admin(), Tools: []ToolStep{{ToolID: "bypass_truth"}}})
	if ex.Error != "FORBIDDEN_TOOL" {
		t.Fatalf("%+v", ex)
	}
}

func TestEnableThenResolveSamePlane(t *testing.T) {
	p := NewPlane()
	if err := p.Enable("tenant-a", "AGT-014", admin()); err != nil {
		t.Fatal(err)
	}
	if _, m, err := p.Resolve("AGT-014", admin()); err != nil || m != MaturityExecutable {
		t.Fatalf("expected executable after enable: %s %v", m, err)
	}
	ex := p.Execute(ExecRequest{AgentID: "AGT-014", Actor: admin()})
	if ex.Error == "DISABLED_AGENT" {
		t.Fatalf("must not be DISABLED_AGENT after Enable on same plane: %+v", ex)
	}
}

func TestEnableAgentIDMustCanonicalize(t *testing.T) {
	p := NewPlane()
	if err := p.Enable("tenant-a", " agt-014 ", admin()); err != nil {
		t.Fatal(err)
	}
	if _, _, err := p.Resolve("AGT-014", admin()); err != nil {
		t.Fatalf("Resolve after Enable with unnormalized agent id: %v", err)
	}
}

func TestEnableDoesNotLeakAcrossTenants(t *testing.T) {
	p := NewPlane()
	if err := p.Enable("tenant-a", "AGT-014", admin()); err != nil {
		t.Fatal(err)
	}
	other := admin()
	other.TenantID = "tenant-b"
	if _, _, err := p.Resolve("AGT-014", other); err == nil || err.Error() != "DISABLED_AGENT" {
		t.Fatalf("expected DISABLED_AGENT for other tenant, got %v", err)
	}
}

func TestAnalyzeStoryOnPublisherIsUnauthorizedNotDisabled(t *testing.T) {
	p := NewPlane()
	_ = p.Enable("tenant-a", "AGT-014", admin())
	ex := p.Execute(ExecRequest{
		AgentID: "AGT-014", Actor: admin(),
		Tools: []ToolStep{{ToolID: "analyze_story", Input: map[string]any{"tenant_id": "tenant-a", "text": "x"}}},
	})
	if ex.Error == "DISABLED_AGENT" {
		t.Fatal("Resolve should succeed after Enable")
	}
	if ex.Error != "UNAUTHORIZED_TOOL" {
		t.Fatalf("AGT-014 must not receive analyze_story: %+v", ex)
	}
}

func TestCrossTenantGetDenied(t *testing.T) {
	p := NewPlane()
	_ = p.Enable("tenant-a", "AGT-026", admin())
	ex := p.Execute(ExecRequest{AgentID: "AGT-026", Actor: admin()})
	other := admin()
	other.TenantID = "tenant-b"
	if _, err := p.Get(ex.ID, other); err == nil {
		t.Fatal("expected tenant mismatch")
	}
}
