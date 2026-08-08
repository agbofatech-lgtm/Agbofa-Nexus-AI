CREATE TABLE IF NOT EXISTS origination_sources (
    id UUID PRIMARY KEY,
    source_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    reliability_score FLOAT NOT NULL DEFAULT 1.0,
    active BOOLEAN NOT NULL DEFAULT true,
    vector_embedding JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS origination_ingest_jobs (
    id UUID PRIMARY KEY,
    ingest_job_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    source_id VARCHAR(100),
    source_type VARCHAR(50) NOT NULL,
    raw_content TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_msg TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS origination_story_candidates (
    id UUID PRIMARY KEY,
    candidate_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    ingest_job_id VARCHAR(100) REFERENCES origination_ingest_jobs(ingest_job_id),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    confidence_score FLOAT NOT NULL,
    keywords JSONB NOT NULL DEFAULT '[]',
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS origination_stories (
    id UUID PRIMARY KEY,
    story_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    candidate_id VARCHAR(100) REFERENCES origination_story_candidates(candidate_id),
    source_id VARCHAR(100),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    state VARCHAR(50) NOT NULL,
    graph_node_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS origination_graph_nodes (
    id UUID PRIMARY KEY,
    node_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    story_id VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    source_id VARCHAR(100),
    initialized_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE origination_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE origination_ingest_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE origination_story_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE origination_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE origination_graph_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS origination_sources_tenant_isolation_policy ON origination_sources;
CREATE POLICY origination_sources_tenant_isolation_policy ON origination_sources
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS origination_ingest_jobs_tenant_isolation_policy ON origination_ingest_jobs;
CREATE POLICY origination_ingest_jobs_tenant_isolation_policy ON origination_ingest_jobs
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS origination_story_candidates_tenant_isolation_policy ON origination_story_candidates;
CREATE POLICY origination_story_candidates_tenant_isolation_policy ON origination_story_candidates
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS origination_stories_tenant_isolation_policy ON origination_stories;
CREATE POLICY origination_stories_tenant_isolation_policy ON origination_stories
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS origination_graph_nodes_tenant_isolation_policy ON origination_graph_nodes;
CREATE POLICY origination_graph_nodes_tenant_isolation_policy ON origination_graph_nodes
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
