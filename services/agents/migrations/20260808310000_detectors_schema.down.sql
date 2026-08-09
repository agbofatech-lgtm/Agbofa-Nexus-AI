-- Migration: 20260808310000_detectors_schema.down.sql
-- Rollback for IMP-017-B AI Agent Fleet detectors schema

DROP INDEX IF EXISTS idx_source_credibility_tenant_platform;
DROP INDEX IF EXISTS idx_detection_results_tenant_detector;

DROP POLICY IF EXISTS source_credibility_rls_policy ON source_credibility_scores;
DROP TABLE IF EXISTS source_credibility_scores;

DROP POLICY IF EXISTS detection_results_rls_policy ON detection_results;
DROP TABLE IF EXISTS detection_results;
