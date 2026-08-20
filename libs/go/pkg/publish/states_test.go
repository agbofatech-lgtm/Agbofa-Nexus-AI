package publish

import (
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
)

func TestPublishingTransitions(t *testing.T) {
	if err := Transition(StatusDraft, StatusApproved); err != nil {
		t.Fatal(err)
	}
	if err := Transition(StatusPublished, StatusPublishing); err == nil {
		t.Fatal("published -> publishing must be illegal")
	}
	if err := Transition(StatusQueued, StatusPublishing); err != nil {
		t.Fatal(err)
	}
	if err := Transition(StatusScheduled, StatusCancelled); err != nil {
		t.Fatal(err)
	}
}

func TestPolicyGateBrandAndTenant(t *testing.T) {
	now := time.Date(2026, 8, 25, 12, 0, 0, 0, time.UTC)
	base := GateInput{
		Principal: authz.Principal{SubjectID: "u1", TenantID: "t1", Roles: []string{authz.RoleEditor}},
		ContentID: "c1", ContentVersion: "v1", Body: "hello", BrandApplied: true,
		ConnectionID: "acc1", ConnectionTenant: "t1", ConnectionStatus: "ACTIVE", Platform: "x",
		Now: now,
	}
	if g := Validate(base); !g.OK {
		t.Fatalf("expected ok: %+v", g)
	}
	bad := base
	bad.BrandApplied = false
	if g := Validate(bad); g.OK || g.Code != "BRAND_VALIDATION_FAILED" {
		t.Fatalf("brand: %+v", g)
	}
	cross := base
	cross.ConnectionTenant = "t2"
	if g := Validate(cross); g.OK || g.Code != "TENANT_ACCESS_DENIED" {
		t.Fatalf("tenant: %+v", g)
	}
	past := now.Add(-time.Hour)
	sched := base
	sched.ScheduledAt = &past
	if g := Validate(sched); g.OK || g.Code != "SCHEDULE_INVALID" {
		t.Fatalf("schedule: %+v", g)
	}
	yt := base
	yt.Platform = "youtube"
	if g := Validate(yt); !g.OK {
		t.Fatalf("youtube gate: %+v", g)
	}
}

func TestBackoffAndClassify(t *testing.T) {
	if Backoff(1, 0) != 30*time.Second {
		t.Fatal("attempt 1")
	}
	if Classify(nil, 429) != ClassRateLimited {
		t.Fatal("429")
	}
	if Classify(nil, 503) != ClassRetryable {
		t.Fatal("503")
	}
	if Classify(nil, 400) != ClassPermanent {
		t.Fatal("400")
	}
}
