-- IMP-019 Batch F6: Personalization Schema Rollback

-- Drop RLS Policies
DROP POLICY IF EXISTS reader_profiles_rls_policy ON reader_profiles;
DROP POLICY IF EXISTS behavioral_signals_rls_policy ON behavioral_signals;
DROP POLICY IF EXISTS personalized_feeds_rls_policy ON personalized_feeds;
DROP POLICY IF EXISTS recommendation_models_rls_policy ON recommendation_models;

DROP INDEX IF EXISTS idx_behavioral_signals_reader;
DROP INDEX IF EXISTS idx_personalized_feeds_reader;
DROP TABLE IF EXISTS recommendation_models;
DROP TABLE IF EXISTS personalized_feeds;
DROP TABLE IF EXISTS behavioral_signals;
DROP TABLE IF EXISTS reader_profiles;
