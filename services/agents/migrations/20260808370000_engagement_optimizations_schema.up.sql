-- Migration: 20260808370000_engagement_optimizations_schema.up.sql
-- Scope: IMP-018 Engagement Optimization table for PRED-002 persistence
-- Additive Phase 2 schema; zero modification to prior tables.

CREATE TABLE IF NOT EXISTS engagement_optimizations (
    optimization_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_id VARCHAR(128) NOT NULL,
    optimal_times JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
    framing_advice TEXT NOT NULL DEFAULT '',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    optimized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (optimization_id, tenant_id)
);

ALTER TABLE engagement_optimizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY engagement_optimizations_rls_policy ON engagement_optimizations
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX IF NOT EXISTS idx_engagement_optimizations_tenant_content ON engagement_optimizations(tenant_id, content_id);
