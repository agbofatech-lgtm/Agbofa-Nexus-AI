-- Migration: 20260808320000_verification_schema.down.sql
-- Rollback for IMP-017-C AI Agent Fleet verification schema

DROP INDEX IF EXISTS idx_bias_assessments_tenant_signal;
DROP INDEX IF EXISTS idx_claim_extracts_tenant_signal;
DROP INDEX IF EXISTS idx_verification_results_tenant_agent;

DROP POLICY IF EXISTS bias_assessments_rls_policy ON bias_assessments;
DROP TABLE IF EXISTS bias_assessments;

DROP POLICY IF EXISTS claim_extracts_rls_policy ON claim_extracts;
DROP TABLE IF EXISTS claim_extracts;

DROP POLICY IF EXISTS verification_results_rls_policy ON verification_results;
DROP TABLE IF EXISTS verification_results;
