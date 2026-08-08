/**
 * Agbofa Nexus AI — Enterprise Reporting Frontend (IMP-015, SVC-181)
 * Authoritative editorial and revenue reporting export interfaces with tenant isolation.
 */

import { resolveUserSession, checkPermission, validateTenantAccess, UserSessionState } from "../../../packages/api-client/src/auth.ts";

export interface ReportExportRequest {
  tenantId: string;
  reportType: "EDITORIAL_METRICS" | "REVENUE_INTELLIGENCE";
  format: "CSV" | "JSON";
}

export class EnterpriseReportingCenter {
  constructor(private readonly tenantId: string, private readonly session: UserSessionState) {
    if (!validateTenantAccess(session.tenantId, tenantId)) {
      throw new Error("cross_tenant_violation: reporting center tenant mismatch");
    }
    if (!checkPermission(session.roles, "ANALYST") && !checkPermission(session.roles, "EDITOR")) {
      throw new Error("unauthorized: ANALYST or EDITOR role required for Enterprise Reporting Center");
    }
  }

  createExportRequest(reportType: "EDITORIAL_METRICS" | "REVENUE_INTELLIGENCE", format: "CSV" | "JSON"): ReportExportRequest {
    return {
      tenantId: this.tenantId,
      reportType,
      format,
    };
  }
}
