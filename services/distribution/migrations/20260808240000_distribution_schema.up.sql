CREATE TABLE IF NOT EXISTS distribution_publication_jobs (
    id UUID PRIMARY KEY,
    publication_job_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    package_id VARCHAR(100) NOT NULL,
    story_id VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    compliance_status VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    channel_statuses JSONB NOT NULL DEFAULT '[]',
    retry_count INT NOT NULL DEFAULT 0,
    scheduled_time_unix BIGINT NOT NULL,
    published_at_unix BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, publication_job_id)
);

CREATE TABLE IF NOT EXISTS distribution_breaking_news (
    id UUID PRIMARY KEY,
    alert_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    package_id VARCHAR(100) NOT NULL,
    story_id VARCHAR(100) NOT NULL,
    alert_text TEXT NOT NULL,
    priority_channels JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(50) NOT NULL,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, alert_id)
);

CREATE TABLE IF NOT EXISTS distribution_corrections (
    id UUID PRIMARY KEY,
    correction_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    publication_job_id VARCHAR(100) REFERENCES distribution_publication_jobs(publication_job_id),
    corrected_content TEXT NOT NULL,
    correction_note TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS distribution_retractions (
    id UUID PRIMARY KEY,
    retraction_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    publication_job_id VARCHAR(100) REFERENCES distribution_publication_jobs(publication_job_id),
    retraction_reason TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, publication_job_id)
);

CREATE TABLE IF NOT EXISTS distribution_audit_ledger (
    id UUID PRIMARY KEY,
    record_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    publication_job_id VARCHAR(100) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    cryptographic_hash VARCHAR(64) NOT NULL,
    timestamp_unix BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE distribution_publication_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_breaking_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_retractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_audit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS distribution_publication_jobs_tenant_isolation_policy ON distribution_publication_jobs;
CREATE POLICY distribution_publication_jobs_tenant_isolation_policy ON distribution_publication_jobs
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS distribution_breaking_news_tenant_isolation_policy ON distribution_breaking_news;
CREATE POLICY distribution_breaking_news_tenant_isolation_policy ON distribution_breaking_news
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS distribution_corrections_tenant_isolation_policy ON distribution_corrections;
CREATE POLICY distribution_corrections_tenant_isolation_policy ON distribution_corrections
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS distribution_retractions_tenant_isolation_policy ON distribution_retractions;
CREATE POLICY distribution_retractions_tenant_isolation_policy ON distribution_retractions
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS distribution_audit_ledger_tenant_isolation_policy ON distribution_audit_ledger;
CREATE POLICY distribution_audit_ledger_tenant_isolation_policy ON distribution_audit_ledger
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
