CREATE TABLE IF NOT EXISTS operations_release_candidates (
    id UUID PRIMARY KEY,
    candidate_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    version VARCHAR(100) NOT NULL,
    commit_sha VARCHAR(100) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    gate_evaluations JSONB NOT NULL DEFAULT '[]',
    approved_for_promotion BOOLEAN NOT NULL DEFAULT false,
    provenance_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS operations_deployments (
    id UUID PRIMARY KEY,
    deployment_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    candidate_id VARCHAR(100) REFERENCES operations_release_candidates(candidate_id),
    environment VARCHAR(50) NOT NULL,
    version VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    provenance_hash VARCHAR(64) NOT NULL,
    deployed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, deployment_id)
);

CREATE TABLE IF NOT EXISTS operations_rollbacks (
    id UUID PRIMARY KEY,
    rollback_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    current_deployment_id VARCHAR(100) REFERENCES operations_deployments(deployment_id),
    target_deployment_id VARCHAR(100) REFERENCES operations_deployments(deployment_id),
    target_version VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    executed BOOLEAN NOT NULL DEFAULT true,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, rollback_id)
);

CREATE TABLE IF NOT EXISTS operations_dr_backups (
    id UUID PRIMARY KEY,
    backup_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    environment VARCHAR(50) NOT NULL,
    restorable BOOLEAN NOT NULL DEFAULT true,
    provenance_hash VARCHAR(64) NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, backup_id)
);

CREATE TABLE IF NOT EXISTS operations_audit_ledger (
    id UUID PRIMARY KEY,
    record_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    cryptographic_hash VARCHAR(64) NOT NULL,
    timestamp_unix BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE operations_release_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations_rollbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations_dr_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations_audit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operations_release_candidates_tenant_isolation_policy ON operations_release_candidates;
CREATE POLICY operations_release_candidates_tenant_isolation_policy ON operations_release_candidates
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS operations_deployments_tenant_isolation_policy ON operations_deployments;
CREATE POLICY operations_deployments_tenant_isolation_policy ON operations_deployments
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS operations_rollbacks_tenant_isolation_policy ON operations_rollbacks;
CREATE POLICY operations_rollbacks_tenant_isolation_policy ON operations_rollbacks
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS operations_dr_backups_tenant_isolation_policy ON operations_dr_backups;
CREATE POLICY operations_dr_backups_tenant_isolation_policy ON operations_dr_backups
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

DROP POLICY IF EXISTS operations_audit_ledger_tenant_isolation_policy ON operations_audit_ledger;
CREATE POLICY operations_audit_ledger_tenant_isolation_policy ON operations_audit_ledger
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
