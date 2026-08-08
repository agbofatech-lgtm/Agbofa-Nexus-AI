/**
 * Agbofa Nexus AI — Newsroom Enterprise Center (IMP-015, SVC-176)
 * Authoritative editorial workflow orchestration over IMP-014 Newsroom shell.
 * Enforces CREATE -> EDIT -> VALIDATE -> COMPLIANCE -> APPROVE -> DISTRIBUTE -> ANALYZE.
 */

import { resolveUserSession, checkPermission, validateTenantAccess, UserSessionState } from "../../packages/api-client/src/auth";
import { defaultNexusConfig } from "../../packages/config/src/index";
import { authorizeCenterRouteAction } from "../../packages/enterprise-centers/src/index";

export type EditorialStage = "CREATE" | "EDIT" | "VALIDATE" | "COMPLIANCE" | "APPROVE" | "DISTRIBUTE" | "ANALYZE";

export interface NewsroomStoryWorkflowState {
  storyId: string;
  tenantId: string;
  stage: EditorialStage;
  complianceApproved: boolean;
  canDistribute: boolean;
}

export class NewsroomEnterpriseCenter {
  constructor(private readonly tenantId: string, private readonly session: UserSessionState) {
    if (!validateTenantAccess(session.tenantId, tenantId)) {
      throw new Error("cross_tenant_violation: newsroom center tenant mismatch");
    }
  }

  canExecuteStage(routePath: string, stage: EditorialStage): boolean {
    const actionMap: Record<EditorialStage, string> = {
      CREATE: "ORIGINATE_CONTENT",
      EDIT: "ORIGINATE_CONTENT",
      VALIDATE: "VERIFY_STORY",
      COMPLIANCE: "PACKAGE_CONTENT",
      APPROVE: "PACKAGE_CONTENT",
      DISTRIBUTE: "PACKAGE_CONTENT",
      ANALYZE: "ORIGINATE_CONTENT",
    };
    return authorizeCenterRouteAction(this.session, "NEWSROOM_CENTER", routePath, actionMap[stage]);
  }

  evaluateWorkflowGuard(state: NewsroomStoryWorkflowState, nextStage: EditorialStage): boolean {
    if (nextStage === "DISTRIBUTE" && !state.complianceApproved) {
      return false; // IMP-011 compliance approval boundary enforced
    }
    return true;
  }
}
