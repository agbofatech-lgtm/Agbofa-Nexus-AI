-- Migration: 20260808330000_pipeline_schema.up.sql
-- Scope: IMP-017-D AI Agent Fleet (Pipeline Agents AGT-025 through AGT-032)
-- Additive Phase 2 schema; zero modification to Phase 1, IMP-017-A, IMP-017-B, or IMP-017-C tables.

CREATE TABLE IF NOT EXISTS pipeline_states (
    state_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    agent_id VARCHAR(64) NOT NULL,
    current_stage VARCHAR(64) NOT NULL,
    last_status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (state_id, tenant_id)
);

ALTER TABLE pipeline_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY pipeline_states_rls_policy ON pipeline_states
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE TABLE IF NOT EXISTS pipeline_audit_log (
    audit_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    execution_id VARCHAR(128) NOT NULL,
    agent_id VARCHAR(64) NOT NULL,
    action VARCHAR(128) NOT NULL,
    details TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (audit_id, tenant_id)
);

ALTER TABLE pipeline_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY pipeline_audit_log_rls_policy ON pipeline_audit_log
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE TABLE IF NOT EXISTS feedback_loop_signals (
    signal_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    target_agent VARCHAR(64) NOT NULL,
    score_delta DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    reason TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (signal_id, tenant_id)
);

ALTER TABLE feedback_loop_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY feedback_loop_signals_rls_policy ON feedback_loop_signals
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX IF NOT EXISTS idx_pipeline_states_tenant_agent ON pipeline_states(tenant_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_audit_log_tenant_exec ON pipeline_audit_log(tenant_id, execution_id);
CREATE INDEX IF NOT EXISTS idx_feedback_loop_signals_tenant_agent ON feedback_loop_signals(tenant_id, target_agent);
