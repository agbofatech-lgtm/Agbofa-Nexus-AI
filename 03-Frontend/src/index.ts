/**
 * Agbofa Nexus AI — Frontend Application Core Foundation (IMP-014, SVC-167)
 * Central orchestration of design system, API client, authentication middleware, and shell layouts.
 */

import { defaultNexusConfig, NexusAppConfig } from "../packages/config/src/index";
import { resolveUserSession, checkPermission, validateTenantAccess, UserSessionState } from "../packages/api-client/src/auth";
import { sanitizeHtml, generateCorrelationId, buildAriaAttributes } from "../packages/utils/src/index";
import { initializeNewsroomShell, ShellNavigation } from "../apps/newsroom/src/index";
import { initializeReaderWorkspace, ReaderWorkspaceConfig } from "../apps/reader/src/index";

export interface FrontendAppInstance {
  config: NexusAppConfig;
  session: UserSessionState;
  newsroomShell: ShellNavigation;
  readerWorkspace: ReaderWorkspaceConfig;
  correlationId: string;
}

export function createFrontendApplication(tenantId: string, token?: string): FrontendAppInstance {
  const targetTenant = tenantId || defaultNexusConfig.defaultTenantId;
  const session = resolveUserSession(token);

  if (session.authenticated && !validateTenantAccess(session.tenantId, targetTenant)) {
    throw new Error("cross_tenant_violation: session tenant does not match requested app tenant");
  }

  const newsroomShell = initializeNewsroomShell(targetTenant, token);
  const readerWorkspace = initializeReaderWorkspace(targetTenant);

  return {
    config: defaultNexusConfig,
    session,
    newsroomShell,
    readerWorkspace,
    correlationId: generateCorrelationId(),
  };
}

export function validateRouteAccess(session: UserSessionState, requiredRole: string): boolean {
  if (!session.authenticated) return false;
  return checkPermission(session.roles, requiredRole);
}

export function renderAccessibleContainer(title: string, rawContent: string): { aria: Record<string, string>; safeHtml: string } {
  return {
    aria: buildAriaAttributes(title),
    safeHtml: sanitizeHtml(rawContent),
  };
}
