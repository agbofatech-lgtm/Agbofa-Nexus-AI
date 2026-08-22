-- Phase 09: authoritative distributed request rate limiting.
-- Uses PostgreSQL as the shared enforcement store.

CREATE TABLE IF NOT EXISTS request_rate_limits (
    scope_key TEXT NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    window_start TIMESTAMPTZ NOT NULL,
    window_seconds INT NOT NULL,
    hit_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (scope_key, window_start)
);

CREATE INDEX IF NOT EXISTS request_rate_limits_tenant_window_idx
    ON request_rate_limits (tenant_id, window_start DESC);

CREATE INDEX IF NOT EXISTS request_rate_limits_updated_idx
    ON request_rate_limits (updated_at);

ALTER TABLE request_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_rate_limits FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS request_rate_limits_isolation ON request_rate_limits;
CREATE POLICY request_rate_limits_isolation ON request_rate_limits
    FOR ALL USING (
        tenant_id IS NULL
        OR tenant_id::text = current_setting('app.current_tenant', true)
    )
    WITH CHECK (
        tenant_id IS NULL
        OR tenant_id::text = current_setting('app.current_tenant', true)
    );
