-- Phase 07 execution snapshots. Never store OAuth tokens or secrets.
CREATE TABLE IF NOT EXISTS agent_executions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    workflow_id TEXT NOT NULL DEFAULT '',
    agent_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    correlation_id TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL,
    error TEXT NOT NULL DEFAULT '',
    snapshot TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS agent_executions_tenant_idx ON agent_executions (tenant_id, created_at);

ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_executions_isolation ON agent_executions;
CREATE POLICY agent_executions_isolation ON agent_executions
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));
