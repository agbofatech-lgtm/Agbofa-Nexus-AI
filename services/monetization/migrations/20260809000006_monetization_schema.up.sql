-- IMP-021 Batch 3: Monetization Engine Schema (Subscriptions, Paywall, Advertising, Revenue)
-- Authoritative migration for greenfield monetization microservice with RLS on every table.

-- 1. subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    plan_id VARCHAR(128) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(32) NOT NULL,
    price DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    currency VARCHAR(16) NOT NULL DEFAULT 'USD',
    billing_interval VARCHAR(32) NOT NULL DEFAULT 'MONTHLY',
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    max_readers INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_tenant
    ON subscription_plans(tenant_id, is_active);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscription_plans_rls_policy ON subscription_plans FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- 2. reader_subscriptions
CREATE TABLE IF NOT EXISTS reader_subscriptions (
    subscription_id VARCHAR(128) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    reader_id VARCHAR(128) NOT NULL,
    plan_id VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    payment_method_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reader_subscriptions_tenant
    ON reader_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reader_subscriptions_reader
    ON reader_subscriptions(tenant_id, reader_id, status);

ALTER TABLE reader_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY reader_subscriptions_rls_policy ON reader_subscriptions FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- 3. ad_campaigns
CREATE TABLE IF NOT EXISTS ad_campaigns (
    campaign_id VARCHAR(128) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    advertiser_id VARCHAR(128) NOT NULL,
    name VARCHAR(255) NOT NULL,
    budget DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    currency VARCHAR(16) NOT NULL DEFAULT 'USD',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    target_platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    constraints JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_tenant
    ON ad_campaigns(tenant_id, status);

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY ad_campaigns_rls_policy ON ad_campaigns FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- 4. ad_placements
CREATE TABLE IF NOT EXISTS ad_placements (
    placement_id VARCHAR(128) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    campaign_id VARCHAR(128) NOT NULL,
    content_id VARCHAR(128) NOT NULL,
    platform VARCHAR(64) NOT NULL,
    placement_type VARCHAR(32) NOT NULL,
    cpm DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    cpc DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_placements_tenant
    ON ad_placements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ad_placements_campaign
    ON ad_placements(tenant_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_placements_content
    ON ad_placements(tenant_id, content_id);

ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY ad_placements_rls_policy ON ad_placements FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- 5. ad_impressions
CREATE TABLE IF NOT EXISTS ad_impressions (
    impression_id VARCHAR(128) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    placement_id VARCHAR(128) NOT NULL,
    reader_id VARCHAR(128) NOT NULL,
    served_at TIMESTAMPTZ NOT NULL,
    clicked BOOLEAN NOT NULL DEFAULT FALSE,
    clicked_at TIMESTAMPTZ,
    revenue DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    currency VARCHAR(16) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_tenant
    ON ad_impressions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_placement_reader
    ON ad_impressions(tenant_id, placement_id, reader_id, served_at DESC);

ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ad_impressions_rls_policy ON ad_impressions FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- 6. revenue_events
CREATE TABLE IF NOT EXISTS revenue_events (
    event_id VARCHAR(128) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    currency VARCHAR(16) NOT NULL DEFAULT 'USD',
    related_id VARCHAR(128) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_events_tenant
    ON revenue_events(tenant_id, event_type, occurred_at DESC);

ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY revenue_events_rls_policy ON revenue_events FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- 7. paywall_entitlements
CREATE TABLE IF NOT EXISTS paywall_entitlements (
    entitlement_id VARCHAR(128) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    reader_id VARCHAR(128) NOT NULL,
    content_id VARCHAR(128) NOT NULL,
    has_access BOOLEAN NOT NULL DEFAULT FALSE,
    reason VARCHAR(32) NOT NULL,
    metered_count INTEGER NOT NULL DEFAULT 0,
    metered_limit INTEGER NOT NULL DEFAULT 5,
    checked_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_paywall_entitlements UNIQUE (tenant_id, reader_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_paywall_entitlements_tenant
    ON paywall_entitlements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_paywall_entitlements_reader
    ON paywall_entitlements(tenant_id, reader_id, checked_at DESC);

ALTER TABLE paywall_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY paywall_entitlements_rls_policy ON paywall_entitlements FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
