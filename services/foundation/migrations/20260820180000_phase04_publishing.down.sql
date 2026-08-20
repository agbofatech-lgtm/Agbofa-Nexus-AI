DROP POLICY IF EXISTS analytics_snapshots_isolation ON analytics_snapshots;
DROP TABLE IF EXISTS analytics_snapshots;
DROP INDEX IF EXISTS distribution_jobs_lease_idx;
ALTER TABLE distribution_jobs
    DROP COLUMN IF EXISTS attempt_count,
    DROP COLUMN IF EXISTS max_attempts,
    DROP COLUMN IF EXISTS next_attempt_at,
    DROP COLUMN IF EXISTS lease_until,
    DROP COLUMN IF EXISTS lease_owner,
    DROP COLUMN IF EXISTS approved_by,
    DROP COLUMN IF EXISTS approved_at,
    DROP COLUMN IF EXISTS correlation_id,
    DROP COLUMN IF EXISTS platform_publication_id,
    DROP COLUMN IF EXISTS canonical_url,
    DROP COLUMN IF EXISTS started_at,
    DROP COLUMN IF EXISTS completed_at,
    DROP COLUMN IF EXISTS cancelled_at;
