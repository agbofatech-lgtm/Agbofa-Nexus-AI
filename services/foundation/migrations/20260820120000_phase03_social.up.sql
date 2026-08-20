CREATE TABLE IF NOT EXISTS oauth_states (
    state_hash TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    platform TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    pkce_verifier_encrypted TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_connections (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    platform TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    account_name TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT NOT NULL DEFAULT '',
    token_expires_at TIMESTAMPTZ,
    scopes TEXT NOT NULL DEFAULT '',
    last_refresh_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, platform, provider_account_id)
);

CREATE TABLE IF NOT EXISTS distribution_jobs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    actor_id UUID NOT NULL REFERENCES users(id),
    account_id UUID NOT NULL REFERENCES social_connections(id),
    platform TEXT NOT NULL,
    content_id TEXT NOT NULL,
    content_version TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    status TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ,
    snapshot_body TEXT NOT NULL,
    brand_applied BOOLEAN NOT NULL DEFAULT false,
    retry_count INT NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    last_error_class TEXT NOT NULL DEFAULT '',
    last_error TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS distribution_attempts (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES distribution_jobs(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    attempt_no INT NOT NULL,
    status TEXT NOT NULL,
    error_class TEXT NOT NULL DEFAULT '',
    http_status INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS publication_records (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES distribution_jobs(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    account_id UUID NOT NULL REFERENCES social_connections(id),
    platform TEXT NOT NULL,
    content_id TEXT NOT NULL,
    content_version TEXT NOT NULL,
    external_id TEXT NOT NULL DEFAULT '',
    brand_applied BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS distribution_audit (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT '',
    account_id TEXT NOT NULL DEFAULT '',
    content_id TEXT NOT NULL DEFAULT '',
    job_id TEXT NOT NULL DEFAULT '',
    correlation_id TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS oauth_states_expires_idx ON oauth_states (expires_at);
CREATE INDEX IF NOT EXISTS social_connections_tenant_idx ON social_connections (tenant_id, platform);
CREATE INDEX IF NOT EXISTS distribution_jobs_tenant_status_idx ON distribution_jobs (tenant_id, status, scheduled_at);
CREATE INDEX IF NOT EXISTS distribution_audit_tenant_created_idx ON distribution_audit (tenant_id, created_at);

ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS oauth_states_isolation ON oauth_states;
CREATE POLICY oauth_states_isolation ON oauth_states
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS social_connections_isolation ON social_connections;
CREATE POLICY social_connections_isolation ON social_connections
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE distribution_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_jobs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS distribution_jobs_isolation ON distribution_jobs;
CREATE POLICY distribution_jobs_isolation ON distribution_jobs
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE distribution_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_attempts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS distribution_attempts_isolation ON distribution_attempts;
CREATE POLICY distribution_attempts_isolation ON distribution_attempts
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE publication_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication_records FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS publication_records_isolation ON publication_records;
CREATE POLICY publication_records_isolation ON publication_records
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE distribution_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_audit FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS distribution_audit_isolation ON distribution_audit;
CREATE POLICY distribution_audit_isolation ON distribution_audit
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));
