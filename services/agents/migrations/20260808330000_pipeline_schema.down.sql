-- Migration: 20260808330000_pipeline_schema.down.sql
-- Rollback for IMP-017-D AI Agent Fleet pipeline schema

DROP INDEX IF EXISTS idx_feedback_loop_signals_tenant_agent;
DROP INDEX IF EXISTS idx_pipeline_audit_log_tenant_exec;
DROP INDEX IF EXISTS idx_pipeline_states_tenant_agent;

DROP POLICY IF EXISTS feedback_loop_signals_rls_policy ON feedback_loop_signals;
DROP TABLE IF EXISTS feedback_loop_signals;

DROP POLICY IF EXISTS pipeline_audit_log_rls_policy ON pipeline_audit_log;
DROP TABLE IF EXISTS pipeline_audit_log;

DROP POLICY IF EXISTS pipeline_states_rls_policy ON pipeline_states;
DROP TABLE IF EXISTS pipeline_states;
