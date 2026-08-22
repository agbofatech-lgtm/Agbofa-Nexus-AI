package publish

import (
	"context"
	"errors"
	"log"
	"strings"
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
	Number        int
	Status        Status
	HTTPStatus    int
	ExternalID    string
	ErrorCode     string
	ErrorText     string
	NextAttemptAt *time.Time
}

type FinalSafetyDecision struct {
	Allowed    bool
	Deferred   bool
	Code       string
	Reason     string
	RetryAfter time.Duration
}

type Store interface {
	Claim(ctx context.Context, workerID string, now time.Time, lease time.Duration) (Job, bool, error)
	DueScheduled(ctx context.Context, now time.Time) ([]Job, error)
	EnqueueDue(ctx context.Context, job Job) error
	Complete(ctx context.Context, job Job, attempt Attempt) error
	GetByIdempotency(ctx context.Context, tenantID, key string) (Job, error)
}

type Worker struct {
	Store         Store
	Adapter       social.Adapter
	Tokens        func(ctx context.Context, job Job) (social.TokenSet, error)
	BeforePublish func(ctx context.Context, job Job) (FinalSafetyDecision, error)
	MaxTries      int
	Lease         time.Duration
	WorkerID      string
	Now           func() time.Time
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
	fail := func(status Status, code, stageName string, err error, httpStatus int) error {
		attempt := Attempt{
			Number: job.AttemptCount + 1,
			Status: status,
			ErrorCode: code,
			ErrorText: sanitizeWorkerError(err),
			HTTPStatus: httpStatus,
		}
		job.Status = status
		log.Printf("distribution worker failed job_id=%s tenant_id=%s stage=%s platform=%s error_code=%s error=%s attempt=%d http=%d",
			job.ID, job.TenantID, stageName, job.Platform, code, attempt.ErrorText, attempt.Number, httpStatus)
		return w.Store.Complete(ctx, job, attempt)
	}
	deferBlocked := func(code, reason string, retryAfter time.Duration) error {
		if retryAfter <= 0 {
			retryAfter = 5 * time.Minute
		}
		next := w.now().Add(retryAfter)
		attempt := Attempt{
			Number:        job.AttemptCount + 1,
			Status:        StatusRetryWaiting,
			ErrorCode:     firstWorkerText(code, "PUBLISH_BLOCKED"),
			ErrorText:     sanitizeWorkerError(errors.New(firstWorkerText(reason, code, "publish blocked"))),
			NextAttemptAt: &next,
		}
		job.Status = StatusRetryWaiting
		log.Printf("distribution worker blocked job_id=%s tenant_id=%s stage=final_policy platform=%s error_code=%s error=%s retry_at=%s",
			job.ID, job.TenantID, job.Platform, attempt.ErrorCode, attempt.ErrorText, next.UTC().Format(time.RFC3339))
		return w.Store.Complete(ctx, job, attempt)
	}
	if job.PlatformPublicationID != "" {
		job.Status = StatusPublished
		return w.Store.Complete(ctx, job, Attempt{Number: job.AttemptCount, Status: StatusPublished, ErrorCode: "DUPLICATE_PUBLICATION"})
	}
	if !job.BrandApplied {
		return fail(StatusFailed, "BRAND_VALIDATION_FAILED", "brand", social.ErrBrandingRequired, 0)
	}
	spec, ok := social.Lookup(job.Platform)
	if !ok {
		return fail(StatusFailed, "PLATFORM_NOT_SUPPORTED", "platform", social.ErrUnknownPlatform, 0)
	}
	text, mediaURL := social.ParseSnapshot(job.Snapshot)
	pkg, err := social.Adapt(social.CanonicalContent{
		ID: job.ContentID, Version: job.ContentVersion, TenantID: job.TenantID,
		Body: text, MediaURL: mediaURL, BrandApplied: true,
	}, spec)
	if err != nil {
		return fail(StatusFailed, "INVALID_CONTENT", "adapt", err, 0)
	}
	if strings.TrimSpace(pkg.MediaURL) == "" && spec.ID == social.PlatformYouTube {
		return fail(StatusFailed, "INVALID_CONTENT", "media", errors.New("youtube requires media_url in job snapshot"), 0)
	}
	tokens, err := w.Tokens(ctx, job)
	if err != nil {
		return fail(StatusReauthRequired, "REAUTH_REQUIRED", "oauth", err, 0)
	}
	if w.BeforePublish != nil {
		decision, derr := w.BeforePublish(ctx, job)
		if derr != nil {
			return deferBlocked("PUBLISH_POLICY_UNAVAILABLE", derr.Error(), Backoff(job.AttemptCount+1, 0))
		}
		if !decision.Allowed {
			if decision.Deferred {
				return deferBlocked(decision.Code, decision.Reason, decision.RetryAfter)
			}
			return fail(StatusFailed, firstWorkerText(decision.Code, "PUBLISH_BLOCKED"), "final_policy", errors.New(firstWorkerText(decision.Reason, decision.Code, "publish blocked")), 0)
		}
	}
	res, err := w.Adapter.Publish(ctx, tokens, pkg)
	attempt := Attempt{Number: job.AttemptCount + 1, HTTPStatus: res.RawStatus, ExternalID: res.ExternalID, ErrorText: sanitizeWorkerError(err)}
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
				next := w.now().Add(Backoff(attempt.Number, 0))
				job.Status = StatusRetryWaiting
				attempt.Status = StatusRetryWaiting
				attempt.ErrorCode = "TEMPORARY_PLATFORM_FAILURE"
				attempt.NextAttemptAt = &next
			}
		default:
			job.Status = StatusFailed
			attempt.Status = StatusFailed
			attempt.ErrorCode = "PUBLISH_FAILED"
			if errors.Is(err, social.ErrInvalidContent) {
				attempt.ErrorCode = "INVALID_CONTENT"
			}
		}
		log.Printf("distribution worker failed job_id=%s tenant_id=%s stage=youtube_upload platform=%s error_code=%s error=%s attempt=%d http=%d",
			job.ID, job.TenantID, job.Platform, attempt.ErrorCode, attempt.ErrorText, attempt.Number, res.RawStatus)
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

func sanitizeWorkerError(err error) string {
	if err == nil {
		return ""
	}
	s := err.Error()
	lower := strings.ToLower(s)
	for _, needle := range []string{"bearer ", "ya29.", "1//", "access_token", "refresh_token", "client_secret"} {
		if i := strings.Index(lower, needle); i >= 0 {
			s = s[:i] + "[redacted]"
			break
		}
	}
	if len(s) > 400 {
		s = s[:400]
	}
	return s
}

func firstWorkerText(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}
