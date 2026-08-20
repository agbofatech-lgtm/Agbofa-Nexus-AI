package publish

import (
	"context"
	"errors"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/social"
)

var (
	ErrAlreadyPublished = errors.New("publish: already published")
	ErrLeaseLost        = errors.New("publish: lease lost")
	ErrMaxAttempts      = errors.New("publish: dead letter")
)

type Job struct {
	ID, TenantID, ActorID, AccountID, Platform, ContentID, ContentVersion, IdempotencyKey string
	Status                                                                                Status
	Snapshot                                                                              string
	BrandApplied                                                                          bool
	AttemptCount, MaxAttempts                                                             int
	PlatformPublicationID                                                                 string
	ScheduledAt                                                                           *time.Time
}

type Attempt struct {
	Number     int
	Status     Status
	HTTPStatus int
	ExternalID string
	ErrorCode  string
	ErrorText  string
}

type Store interface {
	Claim(ctx context.Context, workerID string, now time.Time, lease time.Duration) (Job, bool, error)
	DueScheduled(ctx context.Context, now time.Time) ([]Job, error)
	EnqueueDue(ctx context.Context, job Job) error
	Complete(ctx context.Context, job Job, attempt Attempt) error
	GetByIdempotency(ctx context.Context, tenantID, key string) (Job, error)
}

type Worker struct {
	Store     Store
	Adapter   social.Adapter
	Tokens    func(ctx context.Context, job Job) (social.TokenSet, error)
	MaxTries  int
	Lease     time.Duration
	WorkerID  string
	Now       func() time.Time
}

func (w Worker) Tick(ctx context.Context) error {
	now := w.now()
	due, err := w.Store.DueScheduled(ctx, now)
	if err != nil {
		return err
	}
	for _, job := range due {
		if err := Transition(job.Status, StatusQueued); err != nil {
			continue
		}
		job.Status = StatusQueued
		_ = w.Store.EnqueueDue(ctx, job)
	}
	job, ok, err := w.Store.Claim(ctx, w.WorkerID, now, w.lease())
	if err != nil || !ok {
		return err
	}
	return w.execute(ctx, job)
}

func (w Worker) execute(ctx context.Context, job Job) error {
	if job.PlatformPublicationID != "" {
		job.Status = StatusPublished
		return w.Store.Complete(ctx, job, Attempt{Number: job.AttemptCount, Status: StatusPublished, ErrorCode: "DUPLICATE_PUBLICATION"})
	}
	if !job.BrandApplied {
		job.Status = StatusFailed
		return w.Store.Complete(ctx, job, Attempt{Number: job.AttemptCount + 1, Status: StatusFailed, ErrorCode: "BRAND_VALIDATION_FAILED"})
	}
	spec, ok := social.Lookup(job.Platform)
	if !ok {
		job.Status = StatusFailed
		return w.Store.Complete(ctx, job, Attempt{Number: job.AttemptCount + 1, Status: StatusFailed, ErrorCode: "PLATFORM_NOT_SUPPORTED"})
	}
	pkg, err := social.Adapt(social.CanonicalContent{
		ID: job.ContentID, Version: job.ContentVersion, TenantID: job.TenantID,
		Body: job.Snapshot, BrandApplied: true,
	}, spec)
	if err != nil {
		job.Status = StatusFailed
		return w.Store.Complete(ctx, job, Attempt{Number: job.AttemptCount + 1, Status: StatusFailed, ErrorCode: "INVALID_CONTENT", ErrorText: err.Error()})
	}
	tokens, err := w.Tokens(ctx, job)
	if err != nil {
		job.Status = StatusReauthRequired
		return w.Store.Complete(ctx, job, Attempt{Number: job.AttemptCount + 1, Status: StatusReauthRequired, ErrorCode: "REAUTH_REQUIRED"})
	}
	res, err := w.Adapter.Publish(ctx, tokens, pkg)
	attempt := Attempt{Number: job.AttemptCount + 1, HTTPStatus: res.RawStatus, ExternalID: res.ExternalID}
	if err != nil {
		class := Classify(err, res.RawStatus)
		switch class {
		case ClassReauth:
			job.Status = StatusReauthRequired
			attempt.Status = StatusReauthRequired
			attempt.ErrorCode = "REAUTH_REQUIRED"
		case ClassRetryable, ClassRateLimited:
			if attempt.Number >= w.max() {
				job.Status = StatusDeadLetter
				attempt.Status = StatusDeadLetter
				attempt.ErrorCode = "DEAD_LETTER"
			} else {
				job.Status = StatusRetryWaiting
				attempt.Status = StatusRetryWaiting
				attempt.ErrorCode = "TEMPORARY_PLATFORM_FAILURE"
			}
		default:
			job.Status = StatusFailed
			attempt.Status = StatusFailed
			attempt.ErrorCode = "PUBLISH_FAILED"
		}
		return w.Store.Complete(ctx, job, attempt)
	}
	if res.ExternalID == "" {
		job.Status = StatusPendingVerify
		attempt.Status = StatusPendingVerify
		attempt.ErrorCode = "PENDING_VERIFICATION"
		return w.Store.Complete(ctx, job, attempt)
	}
	job.Status = StatusPublished
	job.PlatformPublicationID = res.ExternalID
	attempt.Status = StatusPublished
	return w.Store.Complete(ctx, job, attempt)
}

func (w Worker) now() time.Time {
	if w.Now != nil {
		return w.Now()
	}
	return time.Now().UTC()
}

func (w Worker) lease() time.Duration {
	if w.Lease > 0 {
		return w.Lease
	}
	return 30 * time.Second
}

func (w Worker) max() int {
	if w.MaxTries > 0 {
		return w.MaxTries
	}
	return 5
}
