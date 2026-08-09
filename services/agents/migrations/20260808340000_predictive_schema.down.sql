-- Migration: 20260808340000_predictive_schema.down.sql
-- Rollback for IMP-018 Predictive Intelligence schema

DROP INDEX IF EXISTS idx_anomaly_events_tenant_platform;
DROP INDEX IF EXISTS idx_content_forecasts_tenant_content;
DROP INDEX IF EXISTS idx_trend_lifecycle_tenant_topic;
DROP INDEX IF EXISTS idx_virality_predictions_tenant_story;

DROP POLICY IF EXISTS anomaly_detection_events_rls_policy ON anomaly_detection_events;
DROP TABLE IF EXISTS anomaly_detection_events;

DROP POLICY IF EXISTS content_performance_forecasts_rls_policy ON content_performance_forecasts;
DROP TABLE IF EXISTS content_performance_forecasts;

DROP POLICY IF EXISTS trend_lifecycle_models_rls_policy ON trend_lifecycle_models;
DROP TABLE IF EXISTS trend_lifecycle_models;

DROP POLICY IF EXISTS virality_predictions_rls_policy ON virality_predictions;
DROP TABLE IF EXISTS virality_predictions;
