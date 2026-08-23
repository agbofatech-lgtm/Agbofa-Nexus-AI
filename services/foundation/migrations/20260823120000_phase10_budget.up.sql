CREATE TABLE IF NOT EXISTS budget_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    workflow_id TEXT NOT NULL,
    reservation_id TEXT NOT NULL UNIQUE,
    amount BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'RESERVED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,
    metadata JSONB
);

CREATE INDEX idx_budget_reservations_tenant_agent ON budget_reservations(tenant_id, agent_id);
CREATE INDEX idx_budget_reservations_workflow ON budget_reservations(workflow_id);
CREATE INDEX idx_budget_reservations_status ON budget_reservations(status);
CREATE INDEX idx_budget_reservations_reservation_id ON budget_reservations(reservation_id);