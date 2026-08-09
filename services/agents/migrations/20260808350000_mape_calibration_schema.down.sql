-- Migration: 20260808350000_mape_calibration_schema.down.sql
-- Rollback for M9 MAPE Calibration Ledger columns

ALTER TABLE content_performance_forecasts 
    DROP COLUMN IF EXISTS mape,
    DROP COLUMN IF EXISTS actual_engagement,
    DROP COLUMN IF EXISTS actual_views;
