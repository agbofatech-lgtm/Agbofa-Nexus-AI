DROP TRIGGER IF EXISTS configuration_bundles_set_updated_at ON configuration_bundles;
DROP TRIGGER IF EXISTS role_policies_set_updated_at ON role_policies;
DROP TRIGGER IF EXISTS tenants_set_updated_at ON tenants;
DROP FUNCTION IF EXISTS set_updated_at();

ALTER TABLE authorization_audit_log DROP CONSTRAINT IF EXISTS authorization_audit_log_policy_fk;
ALTER TABLE authorization_audit_log DROP CONSTRAINT IF EXISTS authorization_audit_log_subject_fk;
ALTER TABLE authorization_audit_log DROP CONSTRAINT IF EXISTS authorization_audit_log_tenant_fk;

DROP INDEX IF EXISTS config_audit_namespace_version_idx;
DROP INDEX IF EXISTS authorization_audit_tenant_created_idx;
DROP INDEX IF EXISTS role_policies_tenant_id_idx;
DROP INDEX IF EXISTS users_tenant_id_idx;
DROP INDEX IF EXISTS refresh_tokens_tenant_id_idx;
DROP INDEX IF EXISTS refresh_tokens_user_id_idx;

ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS tenant_id;
DROP TABLE IF EXISTS configuration_bundles;
