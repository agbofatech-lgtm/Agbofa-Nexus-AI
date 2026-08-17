-- Migration: 20260808320000_verification_schema.up.sql
-- Scope: IMP-017-C AI Agent Fleet (Verification Agents AGT-017 through AGT-024)
-- Additive Phase 2 schema; zero modification to Phase 1, IMP-017-A, or IMP-017-B tables.

CREATE TABLE IF NOT EXISTS verification_results (
    verification_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    signal_id VARCHAR(128) NOT NULL,
    detection_id VARCHAR(128) NOT NULL,
    agent_id VARCHAR(64) NOT NULL,
    agent_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    uncertainty_metric DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (verification_id, tenant_id)
);

ALTER TABLE verification_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY verification_results_rls_policy ON verification_results
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE TABLE IF NOT EXISTS claim_extracts (
    claim_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    signal_id VARCHAR(128) NOT NULL,
    claim_text TEXT NOT NULL,
    claim_type VARCHAR(64) NOT NULL DEFAULT 'FACTUAL',
    is_verifiable BOOLEAN NOT NULL DEFAULT TRUE,
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (claim_id, tenant_id)
);

ALTER TABLE claim_extracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY claim_extracts_rls_policy ON claim_extracts
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE TABLE IF NOT EXISTS bias_assessments (
    assessment_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    signal_id VARCHAR(128) NOT NULL,
    bias_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    editorial_bias VARCHAR(64) NOT NULL DEFAULT 'NEUTRAL',
    framing_bias VARCHAR(64) NOT NULL DEFAULT 'NEUTRAL',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (assessment_id, tenant_id)
);

ALTER TABLE bias_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY bias_assessments_rls_policy ON bias_assessments
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX IF NOT EXISTS idx_verification_results_tenant_agent ON verification_results(tenant_id, agent_id, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_claim_extracts_tenant_signal ON claim_extracts(tenant_id, signal_id);
CREATE INDEX IF NOT EXISTS idx_bias_assessments_tenant_signal ON bias_assessments(tenant_id, signal_id);
