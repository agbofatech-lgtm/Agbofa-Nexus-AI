CREATE TABLE IF NOT EXISTS role_policies (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    role VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, role)
);

CREATE TABLE IF NOT EXISTS authorization_audit_log (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    roles JSONB NOT NULL DEFAULT '[]',
    resource VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    allowed BOOLEAN NOT NULL,
    reason TEXT NOT NULL,
    policy_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE role_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorization_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS role_policy_tenant_isolation_policy ON role_policies;
CREATE POLICY role_policy_tenant_isolation_policy ON role_policies
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS authorization_audit_tenant_isolation_policy ON authorization_audit_log;
CREATE POLICY authorization_audit_tenant_isolation_policy ON authorization_audit_log
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
