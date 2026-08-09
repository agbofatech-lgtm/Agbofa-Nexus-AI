-- Migration: 20260808340000_predictive_schema.up.sql
-- Scope: IMP-018 Predictive Intelligence (Virality, Engagement, Trend Lifecycle, Performance Forecast, Anomaly Detection)
-- Additive Phase 2 schema; zero modification to Phase 1, IMP-017-A, IMP-017-B, IMP-017-C, or IMP-017-D tables.

CREATE TABLE IF NOT EXISTS virality_predictions (
    prediction_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    story_id VARCHAR(128) NOT NULL,
    virality_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    confidence_interval DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    peak_time_estimate TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    predicted_reach BIGINT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (prediction_id, tenant_id)
);

ALTER TABLE virality_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY virality_predictions_rls_policy ON virality_predictions
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE TABLE IF NOT EXISTS trend_lifecycle_models (
    model_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    topic_id VARCHAR(128) NOT NULL,
    current_phase VARCHAR(64) NOT NULL DEFAULT 'EMERGENCE',
    velocity DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    decay_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    resurgence_prob DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    modeled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (model_id, tenant_id)
);

ALTER TABLE trend_lifecycle_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY trend_lifecycle_models_rls_policy ON trend_lifecycle_models
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE TABLE IF NOT EXISTS content_performance_forecasts (
    forecast_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_id VARCHAR(128) NOT NULL,
    predicted_views BIGINT NOT NULL DEFAULT 0,
    predicted_shares BIGINT NOT NULL DEFAULT 0,
    engagement_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    confidence_metric DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    forecasted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (forecast_id, tenant_id)
);

ALTER TABLE content_performance_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_performance_forecasts_rls_policy ON content_performance_forecasts
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE TABLE IF NOT EXISTS anomaly_detection_events (
    anomaly_id VARCHAR(128) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(32) NOT NULL,
    anomaly_type VARCHAR(128) NOT NULL,
    severity_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (anomaly_id, tenant_id)
);

ALTER TABLE anomaly_detection_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY anomaly_detection_events_rls_policy ON anomaly_detection_events
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX IF NOT EXISTS idx_virality_predictions_tenant_story ON virality_predictions(tenant_id, story_id, virality_score DESC);
CREATE INDEX IF NOT EXISTS idx_trend_lifecycle_tenant_topic ON trend_lifecycle_models(tenant_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_content_forecasts_tenant_content ON content_performance_forecasts(tenant_id, content_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_tenant_platform ON anomaly_detection_events(tenant_id, platform, severity_score DESC);
