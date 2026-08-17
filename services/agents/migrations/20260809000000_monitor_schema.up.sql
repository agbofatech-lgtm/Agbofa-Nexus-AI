-- IMP-017-A Batch 5: Platform Monitor Schema (Additive Migration)
-- Tables: platform_monitor_agents, platform_monitor_signals, platform_rate_limit_log

CREATE TABLE IF NOT EXISTS platform_monitor_agents (
    agent_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    platform        TEXT NOT NULL CHECK (platform IN ('TWITTER','FACEBOOK','INSTAGRAM','TIKTOK','LINKEDIN','YOUTUBE','REDDIT','RSS')),
    status          TEXT NOT NULL DEFAULT 'INITIALIZED',
    config          JSONB NOT NULL DEFAULT '{}',
    rate_limit_max  INTEGER NOT NULL,
    rate_limit_window INTERVAL NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_monitor_signals (
    signal_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    agent_id        UUID NOT NULL REFERENCES platform_monitor_agents(agent_id),
    platform        TEXT NOT NULL,
    signal_type     TEXT NOT NULL,
    external_id     TEXT NOT NULL,
    content         JSONB NOT NULL DEFAULT '{}',
    ai_summary      TEXT,
    confidence      FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_rate_limit_log (
    log_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    agent_id        UUID NOT NULL REFERENCES platform_monitor_agents(agent_id),
    platform        TEXT NOT NULL,
    requests_used   INTEGER NOT NULL,
    requests_max    INTEGER NOT NULL,
    window_start    TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE platform_monitor_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_monitor_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_rate_limit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON platform_monitor_agents
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY tenant_isolation_policy ON platform_monitor_signals
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY tenant_isolation_policy ON platform_rate_limit_log
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monitor_agents_tenant ON platform_monitor_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_monitor_agents_platform ON platform_monitor_agents(tenant_id, platform);
CREATE INDEX IF NOT EXISTS idx_monitor_signals_tenant ON platform_monitor_signals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_monitor_signals_agent ON platform_monitor_signals(agent_id);
CREATE INDEX IF NOT EXISTS idx_monitor_signals_detected ON platform_monitor_signals(tenant_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_agent ON platform_rate_limit_log(agent_id, window_start DESC);
