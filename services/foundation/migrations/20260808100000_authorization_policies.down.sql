DROP POLICY IF EXISTS authorization_audit_tenant_isolation_policy ON authorization_audit_log;
DROP POLICY IF EXISTS role_policy_tenant_isolation_policy ON role_policies;
DROP TABLE IF EXISTS authorization_audit_log;
DROP TABLE IF EXISTS role_policies;
