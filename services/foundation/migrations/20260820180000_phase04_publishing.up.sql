-- Phase 04 extends distribution_jobs into a durable publishing queue.
-- Does not drop Phase 03 tables.

ALTER TABLE distribution_jobs
    ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 5,
    ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS lease_owner TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS approved_by TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS correlation_id TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS platform_publication_id TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS canonical_url TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS distribution_jobs_lease_idx
    ON distribution_jobs (status, next_attempt_at, lease_until);

CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    job_id UUID NOT NULL REFERENCES distribution_jobs(id),
    platform TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    window TEXT NOT NULL DEFAULT '',
    impressions BIGINT,
    views BIGINT,
    likes BIGINT,
    comments BIGINT,
    shares BIGINT,
    clicks BIGINT,
    source_metric TEXT NOT NULL DEFAULT '',
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, resource_id, window, source_metric)
);

ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS analytics_snapshots_isolation ON analytics_snapshots;
CREATE POLICY analytics_snapshots_isolation ON analytics_snapshots
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));
