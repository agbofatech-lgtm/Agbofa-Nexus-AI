/**
 * Agbofa Nexus AI — AI Control Centre Frontend (IMP-015, SVC-175)
 * Controls model routing, prompt registry inspection, and quotas without exposing secrets or credentials.
 */

import { resolveUserSession, checkPermission, validateTenantAccess, UserSessionState } from "../../packages/api-client/src/auth";

export interface ModelRoutingDisplay {
  modelId: string;
  providerName: string; // Non-sensitive display name
  active: boolean;
  quotaRemaining: number;
}

export class AIControlCenter {
  constructor(private readonly tenantId: string, private readonly session: UserSessionState) {
    if (!validateTenantAccess(session.tenantId, tenantId)) {
      throw new Error("cross_tenant_violation: ai control center tenant mismatch");
    }
    if (!checkPermission(session.roles, "ADMIN")) {
      throw new Error("unauthorized: ADMIN role required for AI Control Center");
    }
  }

  getActiveModelsDisplay(): ModelRoutingDisplay[] {
    return [
      {
        modelId: "gpt-4",
        providerName: "Authoritative Primary Provider",
        active: true,
        quotaRemaining: 95000,
      },
    ];
  }
}
