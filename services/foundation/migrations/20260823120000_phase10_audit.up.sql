CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    request_id TEXT NOT NULL,
    agent_id TEXT,
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    channel TEXT,
    outcome TEXT NOT NULL,
    reason TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_time ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);
CREATE INDEX idx_audit_logs_agent ON audit_logs(agent_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);