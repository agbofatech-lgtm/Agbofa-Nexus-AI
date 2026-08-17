-- Migration: 20260808350000_mape_calibration_schema.up.sql
-- Scope: M9 MAPE Calibration Ledger columns for Content Performance Forecasts
-- Additive Phase 2 schema modification; zero Phase 1 tables altered.

ALTER TABLE content_performance_forecasts 
    ADD COLUMN IF NOT EXISTS actual_views BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS actual_engagement DOUBLE PRECISION DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS mape DOUBLE PRECISION DEFAULT 0.0;
