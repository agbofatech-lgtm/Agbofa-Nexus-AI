CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY,
    event_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    story_id VARCHAR(100) NOT NULL,
    channel_id VARCHAR(100),
    cohort_id VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}',
    provenance_hash VARCHAR(64) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_engagement_metrics (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    story_id VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value FLOAT NOT NULL,
    calculation_source VARCHAR(100) NOT NULL,
    provenance_hash VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, story_id, metric_name)
);

CREATE TABLE IF NOT EXISTS analytics_audience_segments (
    id UUID PRIMARY KEY,
    segment_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    engagement_score FLOAT NOT NULL,
    top_categories JSONB NOT NULL DEFAULT '[]',
    provenance_hash VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, segment_id)
);

CREATE TABLE IF NOT EXISTS analytics_feature_store (
    id UUID PRIMARY KEY,
    feature_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    feature_value TEXT NOT NULL,
    value_type VARCHAR(50) NOT NULL,
    provenance_hash VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, entity_id, feature_name)
);

CREATE TABLE IF NOT EXISTS analytics_ai_feedback (
    id UUID PRIMARY KEY,
    feedback_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    story_id VARCHAR(100) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    feedback_type VARCHAR(100) NOT NULL,
    score_delta FLOAT NOT NULL,
    provenance_hash VARCHAR(64) NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_learning_signals (
    id UUID PRIMARY KEY,
    signal_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    status VARCHAR(100) NOT NULL,
    adaptation_score FLOAT NOT NULL,
    governance_note TEXT NOT NULL,
    provenance_hash VARCHAR(64) NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, signal_id)
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_audience_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_feature_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_learning_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analytics_events_tenant_isolation_policy ON analytics_events;
CREATE POLICY analytics_events_tenant_isolation_policy ON analytics_events
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS analytics_engagement_metrics_tenant_isolation_policy ON analytics_engagement_metrics;
CREATE POLICY analytics_engagement_metrics_tenant_isolation_policy ON analytics_engagement_metrics
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS analytics_audience_segments_tenant_isolation_policy ON analytics_audience_segments;
CREATE POLICY analytics_audience_segments_tenant_isolation_policy ON analytics_audience_segments
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS analytics_feature_store_tenant_isolation_policy ON analytics_feature_store;
CREATE POLICY analytics_feature_store_tenant_isolation_policy ON analytics_feature_store
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS analytics_ai_feedback_tenant_isolation_policy ON analytics_ai_feedback;
CREATE POLICY analytics_ai_feedback_tenant_isolation_policy ON analytics_ai_feedback
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS analytics_learning_signals_tenant_isolation_policy ON analytics_learning_signals;
CREATE POLICY analytics_learning_signals_tenant_isolation_policy ON analytics_learning_signals
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
