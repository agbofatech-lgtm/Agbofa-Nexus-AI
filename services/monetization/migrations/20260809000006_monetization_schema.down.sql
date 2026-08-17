-- IMP-021 Batch 3: Monetization Engine Schema DOWN Migration
-- Reverts all 7 tables and RLS policies in reverse dependency order via CASCADE.

DROP POLICY IF EXISTS paywall_entitlements_rls_policy ON paywall_entitlements;
DROP TABLE IF EXISTS paywall_entitlements CASCADE;

DROP POLICY IF EXISTS revenue_events_rls_policy ON revenue_events;
DROP TABLE IF EXISTS revenue_events CASCADE;

DROP POLICY IF EXISTS ad_impressions_rls_policy ON ad_impressions;
DROP TABLE IF EXISTS ad_impressions CASCADE;

DROP POLICY IF EXISTS ad_placements_rls_policy ON ad_placements;
DROP TABLE IF EXISTS ad_placements CASCADE;

DROP POLICY IF EXISTS ad_campaigns_rls_policy ON ad_campaigns;
DROP TABLE IF EXISTS ad_campaigns CASCADE;

DROP POLICY IF EXISTS reader_subscriptions_rls_policy ON reader_subscriptions;
DROP TABLE IF EXISTS reader_subscriptions CASCADE;

DROP POLICY IF EXISTS subscription_plans_rls_policy ON subscription_plans;
DROP TABLE IF EXISTS subscription_plans CASCADE;
