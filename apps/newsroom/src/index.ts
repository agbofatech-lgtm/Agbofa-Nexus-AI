/**
 * Agbofa Nexus AI — Newsroom Workspace Shell Foundation (IMP-014, SVC-173, WF-038)
 * Authoritative shell layout, navigation structure, and tenant context provider.
 * NOTE: Enterprise application centers and specialized newsroom dashboards are implemented in IMP-015.
 */

import { defaultNexusConfig } from "../../packages/config/src/index";
import { resolveUserSession, validateTenantAccess } from "../../packages/api-client/src/auth";

export interface ShellNavigation {
  brandName: string;
  tenantId: string;
  navItems: { id: string; label: string; route: string }[];
}

export function initializeNewsroomShell(tenantId: string, token?: string): ShellNavigation {
  const session = resolveUserSession(token);
  const targetTenant = tenantId || defaultNexusConfig.defaultTenantId;

  if (session.authenticated && !validateTenantAccess(session.tenantId, targetTenant)) {
    throw new Error("cross_tenant_violation: session tenant does not match requested workspace tenant");
  }

  return {
    brandName: defaultNexusConfig.appName + " — Newsroom Workspace",
    tenantId: targetTenant,
    navItems: [
      { id: "nav-home", label: "Overview", route: "/" },
      { id: "nav-origination", label: "Origination", route: "/origination" },
      { id: "nav-verification", label: "Truth Engine", route: "/verification" },
      { id: "nav-factory", label: "Content Factory", route: "/factory" },
    ],
  };
}
