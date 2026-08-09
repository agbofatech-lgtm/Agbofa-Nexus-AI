-- IMP-019 Batch F6: Personalization Schema (Additive Migration)
-- Tables: reader_profiles, behavioral_signals, personalized_feeds, recommendation_models

CREATE TABLE IF NOT EXISTS reader_profiles (
    reader_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    interest_vector JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (reader_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS behavioral_signals (
    signal_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    reader_id VARCHAR(128) NOT NULL,
    content_id VARCHAR(128) NOT NULL,
    interaction_type VARCHAR(32) NOT NULL DEFAULT 'CLICK',
    duration_ms BIGINT NOT NULL DEFAULT 0,
    weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (signal_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_behavioral_signals_reader
    ON behavioral_signals(tenant_id, reader_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS personalized_feeds (
    feed_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    reader_id VARCHAR(128) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (feed_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_personalized_feeds_reader
    ON personalized_feeds(tenant_id, reader_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS recommendation_models (
    model_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    weights JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (model_id, tenant_id)
);

-- Row-Level Security Policies
ALTER TABLE reader_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY reader_profiles_rls_policy ON reader_profiles FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

ALTER TABLE behavioral_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY behavioral_signals_rls_policy ON behavioral_signals FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

ALTER TABLE personalized_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY personalized_feeds_rls_policy ON personalized_feeds FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

ALTER TABLE recommendation_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY recommendation_models_rls_policy ON recommendation_models FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
