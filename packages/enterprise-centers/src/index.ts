/**
 * Agbofa Nexus AI — Enterprise Frontend Centers Architecture & Navigation (IMP-015, SVC-175–181, API-038)
 * Enforces TENANT -> USER SESSION -> ROLE/PERMISSIONS -> AUTHORIZED CENTER -> AUTHORIZED ROUTE -> AUTHORIZED ACTION.
 */

import { defaultNexusConfig } from "../../packages/config/src/index";
import { resolveUserSession, checkPermission, validateTenantAccess, UserSessionState } from "../../packages/api-client/src/auth";

export type CenterId = "NEWSROOM_CENTER" | "READER_CENTER" | "ADMIN_CENTER" | "AI_CONTROL_CENTER" | "OPS_CENTER" | "REPORTING_CENTER";

export interface EnterpriseCenterDefinition {
  centerId: CenterId;
  label: string;
  baseRoute: string;
  requiredRole: string;
  routes: { path: string; label: string; action: string }[];
}

export const authoritativeCenters: EnterpriseCenterDefinition[] = [
  {
    centerId: "NEWSROOM_CENTER",
    label: "Newsroom Center",
    baseRoute: "/newsroom",
    requiredRole: "EDITOR",
    routes: [
      { path: "/origination", label: "Origination Queue", action: "ORIGINATE_CONTENT" },
      { path: "/truth", label: "Truth Verification", action: "VERIFY_STORY" },
      { path: "/factory", label: "Content Factory", action: "PACKAGE_CONTENT" },
    ],
  },
  {
    centerId: "READER_CENTER",
    label: "Reader / AI Workspace Center",
    baseRoute: "/reader",
    requiredRole: "READER",
    routes: [
      { path: "/feed", label: "Audience Feed", action: "VIEW_FEED" },
      { path: "/ai-assistant", label: "AI Narrative Assistant", action: "QUERY_AI" },
    ],
  },
  {
    centerId: "ADMIN_CENTER",
    label: "Administration Center",
    baseRoute: "/admin",
    requiredRole: "ADMIN",
    routes: [
      { path: "/tenants", label: "Tenant Management", action: "MANAGE_TENANTS" },
      { path: "/users", label: "User Access", action: "MANAGE_USERS" },
    ],
  },
  {
    centerId: "AI_CONTROL_CENTER",
    label: "AI Control Center",
    baseRoute: "/ai-control",
    requiredRole: "ADMIN",
    routes: [
      { path: "/models", label: "Model Routing & Quotas", action: "MANAGE_MODELS" },
      { path: "/prompts", label: "Prompt Registry", action: "MANAGE_PROMPTS" },
    ],
  },
  {
    centerId: "OPS_CENTER",
    label: "Platform Operations Center",
    baseRoute: "/ops",
    requiredRole: "ADMIN",
    routes: [
      { path: "/status", label: "System Status Display", action: "VIEW_OPS_STATUS" },
    ],
  },
  {
    centerId: "REPORTING_CENTER",
    label: "Enterprise Reporting Center",
    baseRoute: "/reporting",
    requiredRole: "ANALYST",
    routes: [
      { path: "/editorial", label: "Editorial Metrics", action: "VIEW_REPORT" },
      { path: "/revenue", label: "Revenue Intelligence", action: "VIEW_REPORT" },
    ],
  },
];

export function resolveAuthorizedCenters(session: UserSessionState): EnterpriseCenterDefinition[] {
  if (!session.authenticated) return [];
  return authoritativeCenters.filter((c) => checkPermission(session.roles, c.requiredRole));
}

export function authorizeCenterRouteAction(
  session: UserSessionState,
  centerId: CenterId,
  routePath: string,
  action: string,
): boolean {
  if (!session.authenticated) return false;
  const center = authoritativeCenters.find((c) => c.centerId === centerId);
  if (!center) return false;
  if (!checkPermission(session.roles, center.requiredRole)) return false;
  const route = center.routes.find((r) => r.path === routePath && r.action === action);
  return route !== undefined;
}
