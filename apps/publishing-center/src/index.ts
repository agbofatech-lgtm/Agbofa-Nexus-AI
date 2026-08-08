/**
 * Agbofa Nexus AI — Distribution & Publishing Centre Frontend (IMP-015, SVC-176)
 * Orchestrates authorized user interaction with publishing queues, schedules, and breaking alerts.
 */

import { resolveUserSession, checkPermission, validateTenantAccess, UserSessionState } from "../../packages/api-client/src/auth";

export class PublishingCenter {
  constructor(private readonly tenantId: string, private readonly session: UserSessionState) {
    if (!validateTenantAccess(session.tenantId, tenantId)) {
      throw new Error("cross_tenant_violation: publishing center tenant mismatch");
    }
    if (!checkPermission(session.roles, "EDITOR")) {
      throw new Error("unauthorized: EDITOR role required for Publishing Center");
    }
  }

  canDeliverBreakingAlert(): boolean {
    return checkPermission(this.session.roles, "EDITOR");
  }
}
