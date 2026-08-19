-- PROD-01 integrity: FKs, indexes, updated_at authority, configuration store,
-- and tenant_id on refresh_tokens. RLS FORCE is deferred to PROD-03.

CREATE TABLE IF NOT EXISTS configuration_bundles (
    namespace VARCHAR(255) PRIMARY KEY,
    values JSONB NOT NULL DEFAULT '{}'::jsonb,
    version BIGINT NOT NULL DEFAULT 1,
    modified_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE refresh_tokens
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_tenant_id_idx ON refresh_tokens (tenant_id);
CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON users (tenant_id);
CREATE INDEX IF NOT EXISTS role_policies_tenant_id_idx ON role_policies (tenant_id);
CREATE INDEX IF NOT EXISTS authorization_audit_tenant_created_idx ON authorization_audit_log (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS config_audit_namespace_version_idx ON config_audit_log (namespace, version);

DO $$
BEGIN
    ALTER TABLE authorization_audit_log
        ADD CONSTRAINT authorization_audit_log_tenant_fk
        FOREIGN KEY (tenant_id) REFERENCES tenants(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE authorization_audit_log
        ADD CONSTRAINT authorization_audit_log_subject_fk
        FOREIGN KEY (subject_id) REFERENCES users(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE authorization_audit_log
        ADD CONSTRAINT authorization_audit_log_policy_fk
        FOREIGN KEY (policy_id) REFERENCES role_policies(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_set_updated_at ON tenants;
CREATE TRIGGER tenants_set_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS role_policies_set_updated_at ON role_policies;
CREATE TRIGGER role_policies_set_updated_at
    BEFORE UPDATE ON role_policies
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS configuration_bundles_set_updated_at ON configuration_bundles;
CREATE TRIGGER configuration_bundles_set_updated_at
    BEFORE UPDATE ON configuration_bundles
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

COMMENT ON FUNCTION set_updated_at() IS 'Authority for updated_at is the database trigger, not application clocks.';
