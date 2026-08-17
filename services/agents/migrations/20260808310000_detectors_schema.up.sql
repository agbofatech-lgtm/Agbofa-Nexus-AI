-- Migration: 20260808310000_detectors_schema.up.sql
-- Scope: IMP-017-B AI Agent Fleet (Content Detectors AGT-009 through AGT-016)
-- Additive Phase 2 schema; zero modification to Phase 1 tables or IMP-017-A tables.

CREATE TABLE IF NOT EXISTS detection_results (
    result_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    signal_id VARCHAR(128) NOT NULL,
    detector_id VARCHAR(64) NOT NULL,
    detector_name VARCHAR(128) NOT NULL,
    classification VARCHAR(64) NOT NULL,
    confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (result_id, tenant_id)
);

ALTER TABLE detection_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY detection_results_rls_policy ON detection_results
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE TABLE IF NOT EXISTS source_credibility_scores (
    source_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(32) NOT NULL,
    trust_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    history_rating VARCHAR(64) NOT NULL DEFAULT 'UNKNOWN',
    last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (source_id, tenant_id)
);

ALTER TABLE source_credibility_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY source_credibility_rls_policy ON source_credibility_scores
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX IF NOT EXISTS idx_detection_results_tenant_detector ON detection_results(tenant_id, detector_id, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_source_credibility_tenant_platform ON source_credibility_scores(tenant_id, platform, trust_score DESC);
