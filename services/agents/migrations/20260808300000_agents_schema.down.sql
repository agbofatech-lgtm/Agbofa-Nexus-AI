-- Migration: 20260808300000_agents_schema.down.sql
-- Rollback for IMP-017-A AI Agent Fleet schema

DROP INDEX IF EXISTS idx_trending_topics_tenant_score;
DROP INDEX IF EXISTS idx_monitor_signals_tenant_platform;

DROP POLICY IF EXISTS trending_topics_rls_policy ON trending_topics;
DROP TABLE IF EXISTS trending_topics;

DROP POLICY IF EXISTS monitor_signals_rls_policy ON monitor_signals;
DROP TABLE IF EXISTS monitor_signals;

DROP POLICY IF EXISTS agents_state_rls_policy ON agents_state;
DROP TABLE IF EXISTS agents_state;
