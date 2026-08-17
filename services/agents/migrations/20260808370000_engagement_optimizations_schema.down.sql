-- Migration: 20260808370000_engagement_optimizations_schema.down.sql
-- Rollback for engagement_optimizations schema

DROP INDEX IF EXISTS idx_engagement_optimizations_tenant_content;
DROP POLICY IF EXISTS engagement_optimizations_rls_policy ON engagement_optimizations;
DROP TABLE IF EXISTS engagement_optimizations;
