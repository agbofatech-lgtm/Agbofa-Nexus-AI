package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/libs/go/pkg/publish"
)

func tenantOrEmpty(ctx context.Context) (string, bool) {
	return database.TenantFromContext(ctx)
}

func (s *DistStore) Claim(ctx context.Context, workerID string, now time.Time, lease time.Duration) (publish.Job, bool, error) {
	tenantID, ok := tenantOrEmpty(ctx)
	if !ok {
		return publish.Job{}, false, nil
	}
	until := now.Add(lease)
	var job DistJob
	var pubID string
	var maxAtt int
	err := s.db.QueryRow(ctx, `
UPDATE distribution_jobs SET
    status = 'PUBLISHING',
    lease_owner = $1,
    lease_until = $2,
    started_at = COALESCE(started_at, now()),
    attempt_count = attempt_count + 1,
    updated_at = now()
WHERE id = (
    SELECT id FROM distribution_jobs
    WHERE tenant_id = $4
      AND status IN ('QUEUED', 'RETRY_WAITING')
      AND (next_attempt_at IS NULL OR next_attempt_at <= $3)
      AND (lease_until IS NULL OR lease_until < $3)
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
)
RETURNING id, tenant_id::text, actor_id::text, account_id::text, platform, content_id, content_version,
          idempotency_key, status, snapshot_body, brand_applied, attempt_count, max_attempts,
          COALESCE(platform_publication_id, ''), scheduled_at`,
		workerID, until, now, tenantID).Scan(
		&job.ID, &job.TenantID, &job.ActorID, &job.AccountID, &job.Platform, &job.ContentID, &job.ContentVersion,
		&job.IdempotencyKey, &job.Status, &job.Snapshot, &job.BrandApplied, &job.RetryCount, &maxAtt, &pubID, &job.ScheduledAt)
	if err != nil {
		mapped := mapDB(err)
		if errors.Is(mapped, database.ErrNotFound) {
			return publish.Job{}, false, nil
		}
		return publish.Job{}, false, mapped
	}
	return toPubJob(job, pubID), true, nil
}

func (s *DistStore) DueScheduled(ctx context.Context, now time.Time) ([]publish.Job, error) {
	tenantID, ok := tenantOrEmpty(ctx)
	if !ok {
		return nil, nil
	}
	rows, err := s.db.Query(ctx, `
SELECT id, tenant_id::text, actor_id::text, account_id::text, platform, content_id, content_version,
       idempotency_key, status, snapshot_body, brand_applied, attempt_count, max_attempts,
       COALESCE(platform_publication_id, ''), scheduled_at
FROM distribution_jobs
WHERE tenant_id = $2 AND status = 'SCHEDULED' AND scheduled_at IS NOT NULL AND scheduled_at <= $1`, now, tenantID)
	if err != nil {
		return nil, mapDB(err)
	}
	defer rows.Close()
	var out []publish.Job
	for rows.Next() {
		var job DistJob
		var pubID string
		var maxAtt int
		if err := rows.Scan(&job.ID, &job.TenantID, &job.ActorID, &job.AccountID, &job.Platform, &job.ContentID, &job.ContentVersion,
			&job.IdempotencyKey, &job.Status, &job.Snapshot, &job.BrandApplied, &job.RetryCount, &maxAtt, &pubID, &job.ScheduledAt); err != nil {
			return nil, mapDB(err)
		}
		out = append(out, toPubJob(job, pubID))
	}
	return out, rows.Err()
}

func (s *DistStore) EnqueueDue(ctx context.Context, job publish.Job) error {
	_, err := s.db.Exec(ctx, `UPDATE distribution_jobs SET status = 'QUEUED', updated_at = now() WHERE id = $1 AND tenant_id = $2 AND status = 'SCHEDULED'`, job.ID, job.TenantID)
	return mapDB(err)
}

func (s *DistStore) Complete(ctx context.Context, job publish.Job, attempt publish.Attempt) error {
	_, err := s.db.Exec(ctx, `
UPDATE distribution_jobs SET
    status = $3,
    last_error_class = $4,
    last_error = $5,
    platform_publication_id = CASE WHEN $6 <> '' THEN $6 ELSE platform_publication_id END,
    completed_at = CASE WHEN $3 IN ('PUBLISHED','FAILED','DEAD_LETTER','CANCELLED') THEN now() ELSE completed_at END,
    next_attempt_at = CASE WHEN $3 = 'RETRY_WAITING' THEN now() + interval '30 seconds' ELSE next_attempt_at END,
    lease_until = NULL,
    updated_at = now()
WHERE id = $1 AND tenant_id = $2`,
		job.ID, job.TenantID, string(job.Status), attempt.ErrorCode, attempt.ErrorText, attempt.ExternalID)
	if err != nil {
		return mapDB(err)
	}
	id, err := newID()
	if err != nil {
		return err
	}
	_, err = s.db.Exec(ctx, `
INSERT INTO distribution_attempts (id, job_id, tenant_id, attempt_no, status, error_class, http_status)
VALUES ($1,$2,$3,$4,$5,$6,$7)`, id, job.ID, job.TenantID, attempt.Number, string(attempt.Status), attempt.ErrorCode, attempt.HTTPStatus)
	return mapDB(err)
}

func (s *DistStore) GetByIdempotency(ctx context.Context, tenantID, key string) (publish.Job, error) {
	var job DistJob
	var pubID string
	err := s.db.QueryRow(ctx, `
SELECT id, tenant_id::text, actor_id::text, account_id::text, platform, content_id, content_version,
       idempotency_key, status, snapshot_body, brand_applied, attempt_count, max_attempts,
       COALESCE(platform_publication_id, ''), scheduled_at
FROM distribution_jobs WHERE tenant_id = $1 AND idempotency_key = $2`, tenantID, key).Scan(
		&job.ID, &job.TenantID, &job.ActorID, &job.AccountID, &job.Platform, &job.ContentID, &job.ContentVersion,
		&job.IdempotencyKey, &job.Status, &job.Snapshot, &job.BrandApplied, &job.RetryCount, &job.RetryCount, &pubID, &job.ScheduledAt)
	if err != nil {
		return publish.Job{}, mapDB(err)
	}
	return toPubJob(job, pubID), nil
}

func (s *DistStore) Approve(ctx context.Context, tenantID, id, actor string) error {
	tag, err := s.db.Exec(ctx, `
UPDATE distribution_jobs SET status = 'APPROVED', approved_by = $3, approved_at = now(), updated_at = now()
WHERE tenant_id = $1 AND id = $2 AND status IN ('DRAFT','PENDING_APPROVAL')`, tenantID, id, actor)
	if err != nil {
		return mapDB(err)
	}
	if tag.RowsAffected() == 0 {
		return database.ErrNotFound
	}
	return nil
}

func toPubJob(job DistJob, pubID string) publish.Job {
	return publish.Job{
		ID: job.ID, TenantID: job.TenantID, ActorID: job.ActorID, AccountID: job.AccountID,
		Platform: job.Platform, ContentID: job.ContentID, ContentVersion: job.ContentVersion,
		IdempotencyKey: job.IdempotencyKey, Status: publish.Status(job.Status), Snapshot: job.Snapshot,
		BrandApplied: job.BrandApplied, AttemptCount: job.RetryCount, MaxAttempts: 5,
		PlatformPublicationID: pubID, ScheduledAt: job.ScheduledAt,
	}
}
