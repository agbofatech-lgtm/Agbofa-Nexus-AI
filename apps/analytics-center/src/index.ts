/**
 * Agbofa Nexus AI — Analytics & Intelligence Centre Frontend (IMP-015, SVC-177, API-038)
 * Displays authoritative editorial, revenue, and audience dashboards with mandatory tenant filters.
 */

import { resolveUserSession, checkPermission, validateTenantAccess, UserSessionState } from "../../packages/api-client/src/auth";

export class AnalyticsCenter {
  constructor(private readonly tenantId: string, private readonly session: UserSessionState) {
    if (!validateTenantAccess(session.tenantId, tenantId)) {
      throw new Error("cross_tenant_violation: analytics center tenant mismatch");
    }
    if (!checkPermission(session.roles, "ANALYST") && !checkPermission(session.roles, "EDITOR")) {
      throw new Error("unauthorized: ANALYST or EDITOR role required for Analytics Center");
    }
  }

  getDashboardFilter(): { tenantId: string; window: string } {
    return {
      tenantId: this.tenantId,
      window: "24H",
    };
  }
}
