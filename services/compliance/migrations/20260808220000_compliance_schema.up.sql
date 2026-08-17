CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    package_id VARCHAR(100) NOT NULL,
    story_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    overall_score FLOAT NOT NULL,
    rights_result JSONB NOT NULL DEFAULT '{}',
    originality_result JSONB NOT NULL DEFAULT '{}',
    legal_result JSONB NOT NULL DEFAULT '{}',
    privacy_result JSONB NOT NULL DEFAULT '{}',
    safety_result JSONB NOT NULL DEFAULT '{}',
    policy_result JSONB NOT NULL DEFAULT '{}',
    violations JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, report_id)
);

CREATE TABLE IF NOT EXISTS compliance_reviews (
    id UUID PRIMARY KEY,
    decision_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    report_id VARCHAR(100) REFERENCES compliance_reports(report_id),
    approved BOOLEAN NOT NULL,
    reviewer_id VARCHAR(100) NOT NULL,
    comments TEXT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, decision_id)
);

CREATE TABLE IF NOT EXISTS compliance_audit_ledger (
    id UUID PRIMARY KEY,
    record_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    package_id VARCHAR(100) NOT NULL,
    check_type VARCHAR(100) NOT NULL,
    result_status VARCHAR(100) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    cryptographic_hash VARCHAR(64) NOT NULL,
    timestamp_unix BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS compliance_reports_tenant_isolation_policy ON compliance_reports;
CREATE POLICY compliance_reports_tenant_isolation_policy ON compliance_reports
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS compliance_reviews_tenant_isolation_policy ON compliance_reviews;
CREATE POLICY compliance_reviews_tenant_isolation_policy ON compliance_reviews
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS compliance_audit_ledger_tenant_isolation_policy ON compliance_audit_ledger;
CREATE POLICY compliance_audit_ledger_tenant_isolation_policy ON compliance_audit_ledger
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
