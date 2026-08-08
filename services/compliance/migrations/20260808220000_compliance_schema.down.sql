DROP POLICY IF EXISTS compliance_audit_ledger_tenant_isolation_policy ON compliance_audit_ledger;
DROP POLICY IF EXISTS compliance_reviews_tenant_isolation_policy ON compliance_reviews;
DROP POLICY IF EXISTS compliance_reports_tenant_isolation_policy ON compliance_reports;
DROP TABLE IF EXISTS compliance_audit_ledger;
DROP TABLE IF EXISTS compliance_reviews;
DROP TABLE IF EXISTS compliance_reports;
