-- Phase 05: governed autonomy, memory, scenarios, AI cost ledger.
-- Simulations are stored as SIMULATION and never imply a provider call.

CREATE TABLE IF NOT EXISTS autonomy_configs (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
    global_level INT NOT NULL DEFAULT 0,
    kill_switch TEXT NOT NULL DEFAULT 'ARMED',
    kill_switch_by TEXT NOT NULL DEFAULT '',
    kill_switch_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS autonomy_domains (
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    domain TEXT NOT NULL,
    level INT NOT NULL DEFAULT 0,
    approval_requirement TEXT NOT NULL DEFAULT 'RISK_BASED',
    restrictions TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, domain)
);

CREATE TABLE IF NOT EXISTS approval_policies (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    trigger TEXT NOT NULL DEFAULT '',
    risk TEXT NOT NULL DEFAULT 'HIGH',
    requirement TEXT NOT NULL DEFAULT 'ALWAYS',
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approval_tickets (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    policy_id TEXT NOT NULL DEFAULT '',
    requester_id TEXT NOT NULL,
    action TEXT NOT NULL,
    domain TEXT NOT NULL,
    resource TEXT NOT NULL DEFAULT '',
    risk TEXT NOT NULL DEFAULT 'HIGH',
    status TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    approver_id TEXT NOT NULL DEFAULT '',
    correlation_id TEXT NOT NULL DEFAULT '',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS autonomy_runs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    actor_id TEXT NOT NULL,
    objective TEXT NOT NULL,
    strategy TEXT NOT NULL DEFAULT '',
    fingerprint TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SIMULATION',
    execution_reality TEXT NOT NULL DEFAULT 'SIMULATION',
    snapshot TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, fingerprint)
);

CREATE TABLE IF NOT EXISTS governed_memories (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    actor_id TEXT NOT NULL,
    insight TEXT NOT NULL,
    evidence TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT '',
    classification TEXT NOT NULL DEFAULT 'OBSERVATION',
    confidence TEXT NOT NULL DEFAULT 'LOW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenario_records (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    actor_id TEXT NOT NULL,
    name TEXT NOT NULL,
    assumptions TEXT NOT NULL DEFAULT '',
    projection TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_usage_ledger (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    subject_id TEXT NOT NULL DEFAULT '',
    provider TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT '',
    task TEXT NOT NULL DEFAULT '',
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    estimated_micros BIGINT NOT NULL DEFAULT 0,
    cost_source TEXT NOT NULL DEFAULT 'ESTIMATED',
    correlation_id TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS autonomy_audit (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL DEFAULT '',
    decision TEXT NOT NULL DEFAULT '',
    reason TEXT NOT NULL DEFAULT '',
    correlation_id TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS autonomy_tickets_tenant_status_idx ON approval_tickets (tenant_id, status, created_at);
CREATE INDEX IF NOT EXISTS autonomy_runs_tenant_idx ON autonomy_runs (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS governed_memories_tenant_idx ON governed_memories (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS ai_usage_ledger_tenant_idx ON ai_usage_ledger (tenant_id, created_at);

ALTER TABLE autonomy_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_configs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS autonomy_configs_isolation ON autonomy_configs;
CREATE POLICY autonomy_configs_isolation ON autonomy_configs
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE autonomy_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_domains FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS autonomy_domains_isolation ON autonomy_domains;
CREATE POLICY autonomy_domains_isolation ON autonomy_domains
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE approval_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_policies FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS approval_policies_isolation ON approval_policies;
CREATE POLICY approval_policies_isolation ON approval_policies
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE approval_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_tickets FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS approval_tickets_isolation ON approval_tickets;
CREATE POLICY approval_tickets_isolation ON approval_tickets
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE autonomy_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_runs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS autonomy_runs_isolation ON autonomy_runs;
CREATE POLICY autonomy_runs_isolation ON autonomy_runs
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE governed_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE governed_memories FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS governed_memories_isolation ON governed_memories;
CREATE POLICY governed_memories_isolation ON governed_memories
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE scenario_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_records FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS scenario_records_isolation ON scenario_records;
CREATE POLICY scenario_records_isolation ON scenario_records
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE ai_usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_ledger FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_usage_ledger_isolation ON ai_usage_ledger;
CREATE POLICY ai_usage_ledger_isolation ON ai_usage_ledger
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE autonomy_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_audit FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS autonomy_audit_isolation ON autonomy_audit;
CREATE POLICY autonomy_audit_isolation ON autonomy_audit
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));
