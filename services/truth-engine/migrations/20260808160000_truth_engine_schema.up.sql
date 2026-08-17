CREATE TABLE IF NOT EXISTS truth_source_reliabilities (
    id UUID PRIMARY KEY,
    source_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    reliability_score FLOAT NOT NULL,
    historical_accuracy_percent INT NOT NULL DEFAULT 95,
    cryptographic_signature_valid BOOLEAN NOT NULL DEFAULT true,
    trust_tier VARCHAR(50) NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS truth_story_claims (
    id UUID PRIMARY KEY,
    claim_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    story_id VARCHAR(100) NOT NULL,
    claim_text TEXT NOT NULL,
    evidence_urls JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(50) NOT NULL,
    evidence_score FLOAT NOT NULL,
    explanation TEXT NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS truth_stories (
    id UUID PRIMARY KEY,
    story_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    source_id VARCHAR(100),
    state VARCHAR(50) NOT NULL,
    confidence_score FLOAT NOT NULL,
    tier VARCHAR(50) NOT NULL,
    misinfo_flagged BOOLEAN NOT NULL DEFAULT false,
    misinfo_score FLOAT NOT NULL DEFAULT 0.0,
    ledger_record_id VARCHAR(100),
    provenance_hash VARCHAR(64) NOT NULL,
    graph_node_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS truth_misinfo_reports (
    id UUID PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    story_id VARCHAR(100) REFERENCES truth_stories(story_id),
    is_misinfo BOOLEAN NOT NULL DEFAULT false,
    risk_score FLOAT NOT NULL,
    flagged_patterns JSONB NOT NULL DEFAULT '[]',
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS truth_editorial_decisions (
    id UUID PRIMARY KEY,
    decision_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    story_id VARCHAR(100) REFERENCES truth_stories(story_id),
    approved BOOLEAN NOT NULL DEFAULT false,
    reason TEXT NOT NULL,
    require_human_override BOOLEAN NOT NULL DEFAULT false,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS truth_provenance_ledger (
    id UUID PRIMARY KEY,
    record_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    story_id VARCHAR(100) NOT NULL,
    claim_id VARCHAR(100),
    source_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    cryptographic_hash VARCHAR(64) NOT NULL,
    timestamp_unix BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS truth_graph_nodes (
    id UUID PRIMARY KEY,
    node_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    story_id VARCHAR(100) NOT NULL,
    truth_state VARCHAR(50) NOT NULL,
    confidence_score FLOAT NOT NULL,
    initialized_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE truth_source_reliabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE truth_story_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE truth_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE truth_misinfo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE truth_editorial_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE truth_provenance_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE truth_graph_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS truth_source_reliabilities_tenant_isolation_policy ON truth_source_reliabilities;
CREATE POLICY truth_source_reliabilities_tenant_isolation_policy ON truth_source_reliabilities
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS truth_story_claims_tenant_isolation_policy ON truth_story_claims;
CREATE POLICY truth_story_claims_tenant_isolation_policy ON truth_story_claims
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS truth_stories_tenant_isolation_policy ON truth_stories;
CREATE POLICY truth_stories_tenant_isolation_policy ON truth_stories
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS truth_misinfo_reports_tenant_isolation_policy ON truth_misinfo_reports;
CREATE POLICY truth_misinfo_reports_tenant_isolation_policy ON truth_misinfo_reports
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS truth_editorial_decisions_tenant_isolation_policy ON truth_editorial_decisions;
CREATE POLICY truth_editorial_decisions_tenant_isolation_policy ON truth_editorial_decisions
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS truth_provenance_ledger_tenant_isolation_policy ON truth_provenance_ledger;
CREATE POLICY truth_provenance_ledger_tenant_isolation_policy ON truth_provenance_ledger
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS truth_graph_nodes_tenant_isolation_policy ON truth_graph_nodes;
CREATE POLICY truth_graph_nodes_tenant_isolation_policy ON truth_graph_nodes
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
