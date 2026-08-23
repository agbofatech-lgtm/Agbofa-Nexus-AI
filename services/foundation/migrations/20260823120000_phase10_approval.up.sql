CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id),
    approver_id UUID REFERENCES users(id),
    request_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ,
    decision_reason TEXT,
    metadata JSONB
);

CREATE INDEX idx_approval_requests_tenant_status ON approval_requests(tenant_id, status);
CREATE INDEX idx_approval_requests_requester ON approval_requests(requester_id);
CREATE INDEX idx_approval_requests_expires_at ON approval_requests(expires_at) WHERE status = 'PENDING';