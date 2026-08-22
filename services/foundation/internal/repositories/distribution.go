package repositories

import (
	"context"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/libs/go/pkg/publish"
	"github.com/agbofa/nexus/libs/go/pkg/social"
	"github.com/jackc/pgx/v5"
)

type DistJob struct {
	ID, TenantID, ActorID, AccountID, Platform, ContentID, ContentVersion, IdempotencyKey, Status, Snapshot, LastClass, LastError string
	BrandApplied                                                                                                                 bool
	RetryCount                                                                                                                   int
	ScheduledAt                                                                                                                  *time.Time
}

type DistStore struct{ db DB }

func NewDistStore(db DB) *DistStore { return &DistStore{db: db} }

func (s *DistStore) inTenant(ctx context.Context, tenantID string, fn func(DB) error) error {
	if tenantID == "" {
		return fn(s.db)
	}
	if p, ok := s.db.(*database.Pool); ok {
		return p.InTenantTx(ctx, tenantID, func(tx pgx.Tx) error { return fn(tx) })
	}
	return fn(s.db)
}

func (s *DistStore) CreateJob(ctx context.Context, job DistJob) (DistJob, error) {
	if job.ID == "" {
		id, err := newID()
		if err != nil {
			return DistJob{}, err
		}
		job.ID = id
	}
	err := s.inTenant(ctx, job.TenantID, func(db DB) error {
		return db.QueryRow(ctx, `
INSERT INTO distribution_jobs (
    id, tenant_id, actor_id, account_id, platform, content_id, content_version,
    idempotency_key, status, scheduled_at, snapshot_body, brand_applied
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
RETURNING id, status`,
			job.ID, job.TenantID, job.ActorID, job.AccountID, job.Platform, job.ContentID, job.ContentVersion,
			job.IdempotencyKey, job.Status, job.ScheduledAt, job.Snapshot, job.BrandApplied).Scan(&job.ID, &job.Status)
	})
	if err != nil {
		if err == database.ErrNotFound || mapDB(err) == database.ErrNotFound {
			return DistJob{}, social.ErrDuplicateJob
		}
		return DistJob{}, mapDB(err)
	}
	return job, nil
}

func (s *DistStore) GetJob(ctx context.Context, tenantID, id string) (DistJob, error) {
	var job DistJob
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		return db.QueryRow(ctx, `
SELECT id, tenant_id::text, actor_id::text, account_id::text, platform, content_id, content_version,
       idempotency_key, status, scheduled_at, snapshot_body, brand_applied, retry_count, last_error_class, last_error
FROM distribution_jobs WHERE tenant_id = $1 AND id = $2`, tenantID, id).Scan(
			&job.ID, &job.TenantID, &job.ActorID, &job.AccountID, &job.Platform, &job.ContentID, &job.ContentVersion,
			&job.IdempotencyKey, &job.Status, &job.ScheduledAt, &job.Snapshot, &job.BrandApplied, &job.RetryCount, &job.LastClass, &job.LastError)
	})
	return job, mapDB(err)
}

func (s *DistStore) ListJobs(ctx context.Context, tenantID string) ([]DistJob, error) {
	var out []DistJob
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		rows, err := db.Query(ctx, `
SELECT id, tenant_id::text, actor_id::text, account_id::text, platform, content_id, content_version,
       idempotency_key, status, scheduled_at, snapshot_body, brand_applied, retry_count, last_error_class, last_error
FROM distribution_jobs WHERE tenant_id = $1 ORDER BY created_at DESC`, tenantID)
		if err != nil {
			return mapDB(err)
		}
		defer rows.Close()
		for rows.Next() {
			var job DistJob
			if err := rows.Scan(&job.ID, &job.TenantID, &job.ActorID, &job.AccountID, &job.Platform, &job.ContentID, &job.ContentVersion,
				&job.IdempotencyKey, &job.Status, &job.ScheduledAt, &job.Snapshot, &job.BrandApplied, &job.RetryCount, &job.LastClass, &job.LastError); err != nil {
				return mapDB(err)
			}
			out = append(out, job)
		}
		return rows.Err()
	})
	return out, err
}

func (s *DistStore) Transition(ctx context.Context, tenantID, id, from, to, errClass, errText string) error {
	socialOK := social.CanTransition(social.JobStatus(from), social.JobStatus(to))
	publishOK := publish.CanTransition(publish.Status(from), publish.Status(to))
	if !socialOK && !publishOK {
		return social.ErrIllegalTransition
	}
	var affected int64
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		tag, err := db.Exec(ctx, `
UPDATE distribution_jobs SET status = $4, last_error_class = $5, last_error = $6, updated_at = now()
WHERE tenant_id = $1 AND id = $2 AND status = $3`, tenantID, id, from, to, errClass, errText)
		if err != nil {
			return mapDB(err)
		}
		affected = tag.RowsAffected()
		return nil
	})
	if err != nil {
		return err
	}
	if affected == 0 {
		return social.ErrIllegalTransition
	}
	return nil
}

func (s *DistStore) Audit(ctx context.Context, tenantID, actor, action, platform, account, content, job, corr string) error {
	id, err := newID()
	if err != nil {
		return err
	}
	return s.inTenant(ctx, tenantID, func(db DB) error {
		_, err = db.Exec(ctx, `
INSERT INTO distribution_audit (id, tenant_id, actor_id, action, platform, account_id, content_id, job_id, correlation_id)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, id, tenantID, actor, action, platform, account, content, job, corr)
		return mapDB(err)
	})
}
