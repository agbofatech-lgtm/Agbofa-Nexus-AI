-- Migration: 20260808300000_agents_schema.up.sql
-- Scope: IMP-017-A AI Agent Fleet (Platform Monitors AGT-001 through AGT-008)
-- Additive Phase 2 schema; zero modification to Phase 1 tables (DB-001 to DB-031).

CREATE TABLE IF NOT EXISTS agents_state (
    agent_id VARCHAR(64) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    last_executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (agent_id, tenant_id)
);

ALTER TABLE agents_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY agents_state_rls_policy ON agents_state
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE TABLE IF NOT EXISTS monitor_signals (
    signal_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(32) NOT NULL,
    source_id VARCHAR(128) NOT NULL,
    author VARCHAR(128) NOT NULL,
    content TEXT NOT NULL,
    url VARCHAR(512) NOT NULL,
    engagement INTEGER NOT NULL DEFAULT 0,
    velocity DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (signal_id, tenant_id)
);

ALTER TABLE monitor_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY monitor_signals_rls_policy ON monitor_signals
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE TABLE IF NOT EXISTS trending_topics (
    topic_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    keyword VARCHAR(128) NOT NULL,
    platform VARCHAR(32) NOT NULL,
    score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    mention_count INTEGER NOT NULL DEFAULT 0,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (topic_id, tenant_id)
);

ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY trending_topics_rls_policy ON trending_topics
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX IF NOT EXISTS idx_monitor_signals_tenant_platform ON monitor_signals(tenant_id, platform);
CREATE INDEX IF NOT EXISTS idx_trending_topics_tenant_score ON trending_topics(tenant_id, score DESC);
