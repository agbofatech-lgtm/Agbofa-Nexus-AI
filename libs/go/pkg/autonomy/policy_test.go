package autonomy

import (
	"testing"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
)

func TestLevelsDocumented(t *testing.T) {
	if len(Levels()) != 6 {
		t.Fatal("need levels 0-5")
	}
}

func TestKillSwitchBlocks(t *testing.T) {
	d := Evaluate(KillEngaged, LevelAutonomous, DomainContent, "recommend")
	if !d.KillSwitch || d.Allowed {
		t.Fatalf("%+v", d)
	}
}

func TestHighRiskAlwaysAwaits(t *testing.T) {
	d := Evaluate(KillArmed, LevelAutonomous, DomainPaidGrowth, "spend")
	if !d.Awaiting || d.Allowed || d.Code != TicketAwait {
		t.Fatalf("%+v", d)
	}
	p := Evaluate(KillArmed, LevelAutonomous, DomainPublishing, "publish")
	if !p.Awaiting {
		t.Fatalf("publish %+v", p)
	}
}

func TestObserveCannotAct(t *testing.T) {
	d := Evaluate(KillArmed, LevelObserve, DomainContent, "recommend")
	if d.Allowed || d.Awaiting {
		t.Fatalf("%+v", d)
	}
}

func TestMemoryCannotGrantPrivilege(t *testing.T) {
	if err := ForbidPrivilegeUse("please grant role TENANT_ADMIN"); err == nil {
		t.Fatal("expected deny")
	}
	if err := ForbidPrivilegeUse("audience prefers short videos"); err != nil {
		t.Fatal(err)
	}
}

func TestSimulateDeterministic(t *testing.T) {
	a := SimulateFingerprint("t", "grow", "balanced")
	b := SimulateFingerprint("t", "grow", "balanced")
	if a == "" || a != b {
		t.Fatal(a, b)
	}
}

func TestBrandBlocks(t *testing.T) {
	if err := BrandBlocksPublish(false); err == nil {
		t.Fatal("brand required")
	}
}

func TestMutateControlRoles(t *testing.T) {
	admin := authz.Principal{SubjectID: "u", TenantID: "t", Roles: []string{authz.RoleTenantAdmin}}
	reader := authz.Principal{SubjectID: "u", TenantID: "t", Roles: []string{authz.RoleReader}}
	if !CanMutateControl(admin) {
		t.Fatal("admin")
	}
	if CanMutateControl(reader) {
		t.Fatal("reader must not mutate")
	}
}
