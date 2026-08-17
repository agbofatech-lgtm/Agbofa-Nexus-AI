/**
 * Agbofa Nexus AI — Enterprise Table & Data View Abstractions (IMP-015)
 * Enforces mandatory tenant isolation filters, pagination, and accessibility on enterprise tables.
 */

export interface TablePagination {
  page: number;
  pageSize: number;
  totalRecords: number;
}

export interface EnterpriseTableQuery {
  tenantId: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filterText?: string;
  pagination: TablePagination;
}

export function buildEnterpriseTableQuery(tenantId: string, page = 1, pageSize = 25): EnterpriseTableQuery {
  if (!tenantId) {
    throw new Error("cross_tenant_violation: table query requires mandatory tenant_id filter");
  }
  return {
    tenantId,
    pagination: {
      page,
      pageSize,
      totalRecords: 0,
    },
  };
}
