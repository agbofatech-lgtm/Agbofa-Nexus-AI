package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
	"github.com/agbofa/nexus/libs/go/pkg/autonomy"
	"github.com/agbofa/nexus/libs/go/pkg/publish"
	"github.com/agbofa/nexus/libs/go/pkg/social"
	"github.com/agbofa/nexus/services/foundation/internal/repositories"
)

type fakeConnections struct {
	conn repositories.Connection
	err  error
}

func (f fakeConnections) GetConnection(context.Context, string, string) (repositories.Connection, error) {
	return f.conn, f.err
}

type fakeJobs struct {
	job        repositories.DistJob
	err        error
	auditCount int
}

func (f *fakeJobs) CreateJob(context.Context, repositories.DistJob) (repositories.DistJob, error) {
	if f.job.ID == "" {
		f.job.ID = "job-1"
	}
	return f.job, f.err
}

func (f *fakeJobs) Audit(context.Context, string, string, string, string, string, string, string, string) error {
	f.auditCount++
	return nil
}

type fakeAutonomy struct {
	level int
	kill  string
	err   error
}

func (f fakeAutonomy) DomainLevel(context.Context, string, string) (int, string, error) {
	return f.level, f.kill, f.err
}

func editorPrincipal() authz.Principal {
	return authz.Principal{SubjectID: "user-1", TenantID: "tenant-a", Roles: []string{authz.RoleEditor}}
}

func activeConnection() repositories.Connection {
	return repositories.Connection{ID: "conn-1", TenantID: "tenant-a", Platform: "x", Status: "ACTIVE"}
}

func TestPublishingBoundaryBlocksKillSwitch(t *testing.T) {
	jobs := &fakeJobs{}
	boundary := publishingBoundary{
		Connections: fakeConnections{conn: activeConnection()},
		Jobs:        jobs,
		Autonomy:    fakeAutonomy{level: autonomy.LevelApprovalGated, kill: autonomy.KillEngaged},
	}
	_, err := boundary.Submit(context.Background(), publishCommand{
		Principal:      editorPrincipal(),
		ConnectionID:   "conn-1",
		ContentID:      "content-1",
		ContentVersion: "v1",
		Body:           "hello world",
		BrandApplied:   true,
		Approved:       true,
	})
	perr, ok := err.(publishBoundaryError)
	if !ok || perr.Status != http.StatusLocked || perr.Code != "KILL_SWITCH_ENGAGED" {
		t.Fatalf("unexpected error: %#v", err)
	}
	if jobs.auditCount != 0 {
		t.Fatal("must not audit a created job when kill switch blocks creation")
	}
}

func TestPublishingBoundaryRequiresApproval(t *testing.T) {
	boundary := publishingBoundary{
		Connections: fakeConnections{conn: activeConnection()},
		Jobs:        &fakeJobs{},
		Autonomy:    fakeAutonomy{level: autonomy.LevelApprovalGated, kill: autonomy.KillArmed},
	}
	_, err := boundary.Submit(context.Background(), publishCommand{
		Principal:      editorPrincipal(),
		ConnectionID:   "conn-1",
		ContentID:      "content-1",
		ContentVersion: "v1",
		Body:           "hello world",
		BrandApplied:   true,
		Approved:       false,
	})
	perr, ok := err.(publishBoundaryError)
	if !ok || perr.Status != http.StatusConflict || perr.Code != "AWAITING_APPROVAL" {
		t.Fatalf("unexpected error: %#v", err)
	}
}

func TestPublishingBoundaryAllowsApprovedJob(t *testing.T) {
	jobs := &fakeJobs{job: repositories.DistJob{ID: "job-1", Status: string(publish.StatusQueued)}}
	boundary := publishingBoundary{
		Connections: fakeConnections{conn: activeConnection()},
		Jobs:        jobs,
		Autonomy:    fakeAutonomy{level: autonomy.LevelApprovalGated, kill: autonomy.KillArmed},
	}
	out, err := boundary.Submit(context.Background(), publishCommand{
		Principal:      editorPrincipal(),
		ConnectionID:   "conn-1",
		ContentID:      "content-1",
		ContentVersion: "v1",
		Body:           "hello world",
		BrandApplied:   true,
		Approved:       true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if out.Job.ID == "" || out.Job.Status != string(publish.StatusQueued) {
		t.Fatalf("unexpected job: %+v", out.Job)
	}
	if jobs.auditCount != 1 {
		t.Fatalf("audit count %d", jobs.auditCount)
	}
}

func TestPublishingBoundaryRequiresBrand(t *testing.T) {
	boundary := publishingBoundary{
		Connections: fakeConnections{conn: activeConnection()},
		Jobs:        &fakeJobs{},
		Autonomy:    fakeAutonomy{level: autonomy.LevelApprovalGated, kill: autonomy.KillArmed},
	}
	_, err := boundary.Submit(context.Background(), publishCommand{
		Principal:      editorPrincipal(),
		ConnectionID:   "conn-1",
		ContentID:      "content-1",
		ContentVersion: "v1",
		Body:           "hello world",
		BrandApplied:   false,
		Approved:       true,
	})
	perr, ok := err.(publishBoundaryError)
	if !ok || perr.Code != "BRAND_VALIDATION_FAILED" {
		t.Fatalf("unexpected error: %#v", err)
	}
}

func TestPublishingBoundaryPreservesDuplicateIdempotency(t *testing.T) {
	boundary := publishingBoundary{
		Connections: fakeConnections{conn: activeConnection()},
		Jobs:        &fakeJobs{err: social.ErrDuplicateJob},
		Autonomy:    fakeAutonomy{level: autonomy.LevelApprovalGated, kill: autonomy.KillArmed},
	}
	out, err := boundary.Submit(context.Background(), publishCommand{
		Principal:      editorPrincipal(),
		ConnectionID:   "conn-1",
		ContentID:      "content-1",
		ContentVersion: "v1",
		Body:           "hello world",
		BrandApplied:   true,
		Approved:       true,
	})
	if err != social.ErrDuplicateJob {
		t.Fatalf("expected duplicate, got %#v", err)
	}
	if out.IdempotencyKey == "" {
		t.Fatal("expected idempotency key on duplicate path")
	}
}

func TestPublishingTickRejectsWhenKillSwitchEngaged(t *testing.T) {
	h := PublishingHTTP{
		Worker:   &publish.Worker{},
		Autonomy: fakeAutonomy{level: autonomy.LevelApprovalGated, kill: autonomy.KillEngaged},
	}
	req := httptest.NewRequest(http.MethodPost, "/rpc/publish.v1.PublishingService/Tick", nil)
	req = req.WithContext(authz.WithPrincipal(req.Context(), editorPrincipal()))
	rec := httptest.NewRecorder()
	h.Tick(rec, req)
	if rec.Code != http.StatusLocked {
		t.Fatalf("code=%d body=%s", rec.Code, rec.Body.String())
	}
}

func TestPublishingBoundaryBlocksUnsafeScheduleTime(t *testing.T) {
	past := time.Now().UTC().Add(-time.Hour)
	boundary := publishingBoundary{
		Connections: fakeConnections{conn: activeConnection()},
		Jobs:        &fakeJobs{},
		Autonomy:    fakeAutonomy{level: autonomy.LevelApprovalGated, kill: autonomy.KillArmed},
	}
	_, err := boundary.Submit(context.Background(), publishCommand{
		Principal:      editorPrincipal(),
		ConnectionID:   "conn-1",
		ContentID:      "content-1",
		ContentVersion: "v1",
		Body:           "hello world",
		BrandApplied:   true,
		Approved:       true,
		ScheduledAt:    &past,
	})
	perr, ok := err.(publishBoundaryError)
	if !ok || perr.Code != "SCHEDULE_INVALID" {
		t.Fatalf("unexpected error: %#v", err)
	}
}
