-- IMP-017-A Batch 5: Platform Monitor Schema Rollback

DROP TABLE IF EXISTS platform_rate_limit_log CASCADE;
DROP TABLE IF EXISTS platform_monitor_signals CASCADE;
DROP TABLE IF EXISTS platform_monitor_agents CASCADE;
