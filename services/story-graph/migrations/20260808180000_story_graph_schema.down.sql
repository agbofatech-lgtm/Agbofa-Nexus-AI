DROP POLICY IF EXISTS story_graph_similarities_tenant_isolation_policy ON story_graph_similarities;
DROP POLICY IF EXISTS story_graph_relationships_tenant_isolation_policy ON story_graph_relationships;
DROP POLICY IF EXISTS story_graph_entities_tenant_isolation_policy ON story_graph_entities;
DROP POLICY IF EXISTS story_graph_nodes_tenant_isolation_policy ON story_graph_nodes;
DROP TABLE IF EXISTS story_graph_similarities;
DROP TABLE IF EXISTS story_graph_relationships;
DROP TABLE IF EXISTS story_graph_entities;
DROP TABLE IF EXISTS story_graph_nodes;
