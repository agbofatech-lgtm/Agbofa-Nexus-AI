-- DB-013 Neo4j Constraint Reference Comment:
-- CREATE CONSTRAINT FOR (n:StoryNode) REQUIRE (n.tenant_id, n.node_id) IS UNIQUE;
-- CREATE CONSTRAINT FOR (n:EntityNode) REQUIRE (n.tenant_id, n.canonical_id) IS UNIQUE;
-- CREATE INDEX FOR (n:EntityNode) ON (n.tenant_id, n.name);

CREATE TABLE IF NOT EXISTS story_graph_nodes (
    id UUID PRIMARY KEY,
    node_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    story_id VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    truth_state VARCHAR(50) NOT NULL,
    confidence_score FLOAT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_to TIMESTAMPTZ NOT NULL DEFAULT '9999-12-31 23:59:59',
    UNIQUE(tenant_id, node_id)
);

CREATE TABLE IF NOT EXISTS story_graph_entities (
    id UUID PRIMARY KEY,
    entity_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    canonical_id VARCHAR(100) NOT NULL,
    name TEXT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, canonical_id)
);

CREATE TABLE IF NOT EXISTS story_graph_relationships (
    id UUID PRIMARY KEY,
    rel_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    source_node_id VARCHAR(100) NOT NULL,
    target_node_id VARCHAR(100) NOT NULL,
    rel_type VARCHAR(50) NOT NULL,
    weight FLOAT NOT NULL DEFAULT 1.0,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_to TIMESTAMPTZ NOT NULL DEFAULT '9999-12-31 23:59:59'
);

CREATE TABLE IF NOT EXISTS story_graph_similarities (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    source_story_id VARCHAR(100) NOT NULL,
    target_story_id VARCHAR(100) NOT NULL,
    similarity_score FLOAT NOT NULL,
    cluster_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, source_story_id, target_story_id)
);

ALTER TABLE story_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_graph_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_graph_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_graph_similarities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS story_graph_nodes_tenant_isolation_policy ON story_graph_nodes;
CREATE POLICY story_graph_nodes_tenant_isolation_policy ON story_graph_nodes
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS story_graph_entities_tenant_isolation_policy ON story_graph_entities;
CREATE POLICY story_graph_entities_tenant_isolation_policy ON story_graph_entities
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS story_graph_relationships_tenant_isolation_policy ON story_graph_relationships;
CREATE POLICY story_graph_relationships_tenant_isolation_policy ON story_graph_relationships
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS story_graph_similarities_tenant_isolation_policy ON story_graph_similarities;
CREATE POLICY story_graph_similarities_tenant_isolation_policy ON story_graph_similarities
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
