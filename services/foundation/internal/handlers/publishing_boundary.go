package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
	"github.com/agbofa/nexus/libs/go/pkg/autonomy"
	"github.com/agbofa/nexus/libs/go/pkg/publish"
	"github.com/agbofa/nexus/libs/go/pkg/social"
	"github.com/agbofa/nexus/services/foundation/internal/repositories"
)

type publishingConnectionStore interface {
	GetConnection(ctx context.Context, tenantID, id string) (repositories.Connection, error)
}

type publishingJobStore interface {
	CreateJob(ctx context.Context, job repositories.DistJob) (repositories.DistJob, error)
	Audit(ctx context.Context, tenantID, actor, action, platform, account, content, job, corr string) error
}

type publishingAutonomyStore interface {
	DomainLevel(ctx context.Context, tenantID, domain string) (int, string, error)
}

type publishingBoundary struct {
	Connections publishingConnectionStore
	Jobs        publishingJobStore
	Autonomy    publishingAutonomyStore
}

type publishCommand struct {
	Principal      authz.Principal
	ConnectionID   string
	ContentID      string
	ContentVersion string
	Body           string
	MediaURL       string
	BrandApplied   bool
	ScheduledAt    *time.Time
	Approved       bool
	CorrelationID  string
	AuditAction    string
}

type publishOutcome struct {
	Account        repositories.Connection
	Job            repositories.DistJob
	IdempotencyKey string
}

type publishBoundaryError struct {
	Status int
	Code   string
}

func (e publishBoundaryError) Error() string { return e.Code }

func (b publishingBoundary) Submit(ctx context.Context, cmd publishCommand) (publishOutcome, error) {
	if cmd.Principal.SubjectID == "" || cmd.Principal.TenantID == "" {
		return publishOutcome{}, publishBoundaryError{Status: http.StatusUnauthorized, Code: "unauthenticated"}
	}
	dec := authz.Decide(authz.Request{
		SubjectID: cmd.Principal.SubjectID,
		TenantID: cmd.Principal.TenantID,
		ResourceTenant: cmd.Principal.TenantID,
		Roles: cmd.Principal.Roles,
		Resource: "content",
		Action: "create",
	})
	if !dec.Allowed {
		return publishOutcome{}, publishBoundaryError{Status: http.StatusForbidden, Code: "unauthorized_publish"}
	}
	if b.Connections == nil || b.Jobs == nil {
		return publishOutcome{}, publishBoundaryError{Status: http.StatusServiceUnavailable, Code: "publish_unavailable"}
	}
	acct, err := b.Connections.GetConnection(ctx, cmd.Principal.TenantID, cmd.ConnectionID)
	if err != nil {
		return publishOutcome{}, publishBoundaryError{Status: http.StatusForbidden, Code: "CONNECTION_NOT_FOUND"}
	}
	if b.Autonomy != nil {
		level, kill, derr := b.Autonomy.DomainLevel(ctx, cmd.Principal.TenantID, autonomy.DomainPublishing)
		if derr != nil {
			return publishOutcome{}, publishBoundaryError{Status: http.StatusServiceUnavailable, Code: "PUBLISH_POLICY_UNAVAILABLE"}
		}
		decision := autonomy.Evaluate(kill, level, autonomy.DomainPublishing, "publish")
		if decision.KillSwitch {
			return publishOutcome{}, publishBoundaryError{Status: http.StatusLocked, Code: "KILL_SWITCH_ENGAGED"}
		}
		if decision.Awaiting && !cmd.Approved {
			return publishOutcome{}, publishBoundaryError{Status: http.StatusConflict, Code: "AWAITING_APPROVAL"}
		}
	}
	version := firstNV(cmd.ContentVersion, "v1")
	gate := publish.Validate(publish.GateInput{
		Principal:         cmd.Principal,
		ContentID:         cmd.ContentID,
		ContentVersion:    version,
		Body:              cmd.Body,
		BrandApplied:      cmd.BrandApplied,
		ConnectionID:      acct.ID,
		ConnectionTenant:  acct.TenantID,
		ConnectionStatus:  acct.Status,
		Platform:          acct.Platform,
		ScheduledAt:       cmd.ScheduledAt,
		Now:               time.Now().UTC(),
	})
	if !gate.OK {
		return publishOutcome{}, publishBoundaryError{Status: http.StatusUnprocessableEntity, Code: gate.Code}
	}
	spec, ok := social.Lookup(acct.Platform)
	if !ok {
		return publishOutcome{}, publishBoundaryError{Status: http.StatusBadRequest, Code: "unknown_platform"}
	}
	pkg, err := social.Adapt(social.CanonicalContent{
		ID:           cmd.ContentID,
		Version:      version,
		TenantID:     cmd.Principal.TenantID,
		Body:         cmd.Body,
		MediaURL:     cmd.MediaURL,
		BrandApplied: true,
		AuthorID:     cmd.Principal.SubjectID,
	}, spec)
	if err != nil {
		return publishOutcome{}, publishBoundaryError{Status: http.StatusUnprocessableEntity, Code: "INVALID_CONTENT"}
	}
	status := string(publish.StatusQueued)
	if cmd.ScheduledAt != nil {
		status = string(publish.StatusScheduled)
	}
	if !cmd.Approved {
		status = string(publish.StatusPendingApproval)
	}
	schedKey := ""
	if cmd.ScheduledAt != nil {
		schedKey = cmd.ScheduledAt.UTC().Format(time.RFC3339)
	}
	key := social.IdempotencyKey(cmd.Principal.TenantID, cmd.ContentID, version, acct.ID, spec.ID, schedKey)
	job, err := b.Jobs.CreateJob(ctx, repositories.DistJob{
		TenantID:       cmd.Principal.TenantID,
		ActorID:        cmd.Principal.SubjectID,
		AccountID:      acct.ID,
		Platform:       string(spec.ID),
		ContentID:      cmd.ContentID,
		ContentVersion: version,
		IdempotencyKey: key,
		Status:         status,
		ScheduledAt:    cmd.ScheduledAt,
		Snapshot:       social.EncodeSnapshot(pkg.Text, pkg.MediaURL),
		BrandApplied:   true,
	})
	out := publishOutcome{Account: acct, Job: job, IdempotencyKey: key}
	if err == social.ErrDuplicateJob {
		return out, err
	}
	if err != nil {
		return publishOutcome{}, publishBoundaryError{Status: http.StatusInternalServerError, Code: "job_create"}
	}
	action := cmd.AuditAction
	if action == "" {
		action = "PUBLICATION_SUBMITTED"
	}
	_ = b.Jobs.Audit(ctx, cmd.Principal.TenantID, cmd.Principal.SubjectID, action, acct.Platform, acct.ID, cmd.ContentID, job.ID, cmd.CorrelationID)
	return out, nil
}

func writePublishBoundaryError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}
	if perr, ok := err.(publishBoundaryError); ok {
		writeErr(w, perr.Status, perr.Code)
		return true
	}
	return false
}
