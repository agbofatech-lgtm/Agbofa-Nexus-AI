-- IMP-017-D Batch 3: Pipeline Agents Schema (Additive Migration)
-- Tables: pipeline_agents, pipeline_results

CREATE TABLE IF NOT EXISTS pipeline_agents (
    agent_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    agent_code   TEXT NOT NULL CHECK (agent_code IN ('AGT-025','AGT-026','AGT-027','AGT-028','AGT-029','AGT-030','AGT-031','AGT-032')),
    name         TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'INITIALIZED',
    config       JSONB NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pipeline_results (
    result_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    agent_id      UUID NOT NULL REFERENCES pipeline_agents(agent_id),
    payload_id    TEXT NOT NULL,
    stage         TEXT NOT NULL,
    status        TEXT NOT NULL,
    target        TEXT,
    priority      TEXT,
    metadata      JSONB NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE pipeline_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON pipeline_agents
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_policy ON pipeline_results
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_agents_tenant ON pipeline_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_agents_code ON pipeline_agents(tenant_id, agent_code);
CREATE INDEX IF NOT EXISTS idx_pipeline_results_tenant ON pipeline_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_results_agent ON pipeline_results(agent_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_results_payload ON pipeline_results(tenant_id, payload_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_results_created ON pipeline_results(tenant_id, created_at DESC);
