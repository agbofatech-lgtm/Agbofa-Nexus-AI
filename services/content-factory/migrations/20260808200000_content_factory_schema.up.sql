CREATE TABLE IF NOT EXISTS content_factory_packages (
    id UUID PRIMARY KEY,
    package_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    story_id VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    brand_voice_id VARCHAR(100),
    qa_report JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, package_id)
);

CREATE TABLE IF NOT EXISTS content_factory_articles (
    id UUID PRIMARY KEY,
    asset_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    package_id VARCHAR(100) REFERENCES content_factory_packages(package_id),
    headline TEXT NOT NULL,
    body_text TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    language VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, asset_id)
);

CREATE TABLE IF NOT EXISTS content_factory_media (
    id UUID PRIMARY KEY,
    asset_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    package_id VARCHAR(100) REFERENCES content_factory_packages(package_id),
    asset_type VARCHAR(50) NOT NULL,
    content_spec TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_factory_social (
    id UUID PRIMARY KEY,
    asset_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    package_id VARCHAR(100) REFERENCES content_factory_packages(package_id),
    platform VARCHAR(50) NOT NULL,
    post_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_factory_brand_voices (
    id UUID PRIMARY KEY,
    brand_voice_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    tone VARCHAR(100) NOT NULL,
    style_rules JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, brand_voice_id)
);

CREATE TABLE IF NOT EXISTS content_factory_reviews (
    id UUID PRIMARY KEY,
    decision_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    package_id VARCHAR(100) REFERENCES content_factory_packages(package_id),
    approved BOOLEAN NOT NULL,
    reviewer_id VARCHAR(100) NOT NULL,
    comments TEXT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE content_factory_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_factory_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_factory_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_factory_social ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_factory_brand_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_factory_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_factory_packages_tenant_isolation_policy ON content_factory_packages;
CREATE POLICY content_factory_packages_tenant_isolation_policy ON content_factory_packages
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS content_factory_articles_tenant_isolation_policy ON content_factory_articles;
CREATE POLICY content_factory_articles_tenant_isolation_policy ON content_factory_articles
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS content_factory_media_tenant_isolation_policy ON content_factory_media;
CREATE POLICY content_factory_media_tenant_isolation_policy ON content_factory_media
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS content_factory_social_tenant_isolation_policy ON content_factory_social;
CREATE POLICY content_factory_social_tenant_isolation_policy ON content_factory_social
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS content_factory_brand_voices_tenant_isolation_policy ON content_factory_brand_voices;
CREATE POLICY content_factory_brand_voices_tenant_isolation_policy ON content_factory_brand_voices
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS content_factory_reviews_tenant_isolation_policy ON content_factory_reviews;
CREATE POLICY content_factory_reviews_tenant_isolation_policy ON content_factory_reviews
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
