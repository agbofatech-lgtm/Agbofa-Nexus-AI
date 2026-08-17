-- IMP-017-B Batch 6: Content Detector Schema (Additive Migration)
-- Tables: content_detectors, detection_results

CREATE TABLE IF NOT EXISTS content_detectors (
    detector_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    detector_type   TEXT NOT NULL CHECK (detector_type IN ('BREAKING_NEWS','TREND','SENTIMENT','CREDIBILITY','MULTIMEDIA','LANGUAGE','DUPLICATE','VIRALITY')),
    status          TEXT NOT NULL DEFAULT 'INITIALIZED',
    config          JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS detection_results (
    result_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    detector_id     UUID NOT NULL REFERENCES content_detectors(detector_id),
    signal_id       UUID REFERENCES platform_monitor_signals(signal_id),
    detector_type   TEXT NOT NULL,
    classification  TEXT NOT NULL,
    confidence      FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    content_hash    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    evidence        JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE content_detectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON content_detectors
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY tenant_isolation_policy ON detection_results
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_detectors_tenant ON content_detectors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_detectors_type ON content_detectors(tenant_id, detector_type);
CREATE INDEX IF NOT EXISTS idx_detection_results_tenant ON detection_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_detection_results_detector ON detection_results(detector_id);
CREATE INDEX IF NOT EXISTS idx_detection_results_signal ON detection_results(signal_id);
CREATE INDEX IF NOT EXISTS idx_detection_results_created ON detection_results(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detection_results_hash ON detection_results(content_hash);
