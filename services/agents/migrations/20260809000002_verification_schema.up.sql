-- IMP-017-C Batch 6: Verification Agents Schema (Additive Migration)
-- Tables: verification_agents, verification_results

CREATE TABLE IF NOT EXISTS verification_agents (
    agent_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    agent_code      TEXT NOT NULL CHECK (agent_code IN ('AGT-017','AGT-018','AGT-019','AGT-020','AGT-021','AGT-022','AGT-023','AGT-024')),
    name            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'ACTIVE',
    config          JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_results (
    result_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    agent_id        UUID NOT NULL REFERENCES verification_agents(agent_id),
    claim_id        TEXT NOT NULL,
    signal_id       UUID REFERENCES platform_monitor_signals(signal_id),
    verdict         TEXT NOT NULL,
    classification  TEXT NOT NULL,
    confidence      FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    uncertainty     FLOAT CHECK (uncertainty >= 0 AND uncertainty <= 1),
    sources         JSONB NOT NULL DEFAULT '[]',
    evidence        JSONB NOT NULL DEFAULT '[]',
    scoring_breakdown JSONB NOT NULL DEFAULT '{}',
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE verification_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON verification_agents
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_policy ON verification_results
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verification_agents_tenant ON verification_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_verification_agents_code ON verification_agents(tenant_id, agent_code);
CREATE INDEX IF NOT EXISTS idx_verification_results_tenant ON verification_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_verification_results_agent ON verification_results(agent_id);
CREATE INDEX IF NOT EXISTS idx_verification_results_claim ON verification_results(tenant_id, claim_id);
CREATE INDEX IF NOT EXISTS idx_verification_results_signal ON verification_results(signal_id);
CREATE INDEX IF NOT EXISTS idx_verification_results_created ON verification_results(tenant_id, created_at DESC);
