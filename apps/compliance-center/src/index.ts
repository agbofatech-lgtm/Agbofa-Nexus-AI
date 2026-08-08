/**
 * Agbofa Nexus AI — Compliance & Security Centre Frontend (IMP-015, SVC-179)
 * Orchestrates human compliance officer review queues and displays audit ledger provenance.
 */

import { resolveUserSession, checkPermission, validateTenantAccess, UserSessionState } from "../../../packages/api-client/src/auth.ts";

export class ComplianceCenter {
  constructor(private readonly tenantId: string, private readonly session: UserSessionState) {
    if (!validateTenantAccess(session.tenantId, tenantId)) {
      throw new Error("cross_tenant_violation: compliance center tenant mismatch");
    }
    if (!checkPermission(session.roles, "ADMIN")) {
      throw new Error("unauthorized: ADMIN role required for Compliance Center");
    }
  }

  canReviewPackage(packageId: string): boolean {
    return packageId !== "" && checkPermission(this.session.roles, "ADMIN");
  }
}
