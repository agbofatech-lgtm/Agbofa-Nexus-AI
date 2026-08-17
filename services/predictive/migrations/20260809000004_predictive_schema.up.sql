-- IMP-018 Batch 3: Predictive Intelligence Engine Schema (Additive Migration)
-- Tables: prediction_models, prediction_results, training_examples

CREATE TABLE IF NOT EXISTS prediction_models (
    model_id        TEXT PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('VIRALITY','ENGAGEMENT','CONTENT_OPTIMIZATION','TREND_LIFECYCLE','ANOMALY','PUBLISHING_TIME')),
    version         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'CANDIDATE',
    accuracy        FLOAT CHECK (accuracy >= 0 AND accuracy <= 1),
    features        JSONB NOT NULL DEFAULT '{}',
    artifact_path   TEXT NOT NULL,
    trained_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (model_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS prediction_results (
    result_id       TEXT PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    prediction_type TEXT NOT NULL,
    request_id      TEXT NOT NULL,
    score           FLOAT CHECK (score >= 0 AND score <= 1),
    confidence      FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    tier            TEXT NOT NULL,
    outputs         JSONB NOT NULL DEFAULT '{}',
    model_version   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_examples (
    example_id      TEXT PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    prediction_type TEXT NOT NULL,
    features        JSONB NOT NULL DEFAULT '{}',
    labels          JSONB NOT NULL DEFAULT '{}',
    collected_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE prediction_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON prediction_models
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_policy ON prediction_results
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_policy ON training_examples
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prediction_models_tenant ON prediction_models(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prediction_models_type_status ON prediction_models(tenant_id, prediction_type, status);
CREATE INDEX IF NOT EXISTS idx_prediction_results_tenant ON prediction_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prediction_results_type_created ON prediction_results(tenant_id, prediction_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_examples_tenant ON training_examples(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_examples_type_collected ON training_examples(tenant_id, prediction_type, collected_at ASC);
