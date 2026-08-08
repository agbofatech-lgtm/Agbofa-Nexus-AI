/**
 * Agbofa Nexus AI — Frontend Utilities (IMP-014, SVC-170, SVC-171)
 * Authoritative helper functions for tenant resolution, XSS sanitization, correlation IDs, and ARIA helpers.
 */

export function generateCorrelationId(): string {
  return `corr-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function sanitizeHtml(rawInput: string): string {
  if (!rawInput) return "";
  return rawInput
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export interface TenantContext {
  tenantId: string;
  tenantName: string;
}

export function resolveTenantContext(headerValue?: string): TenantContext {
  if (!headerValue || headerValue.trim() === "") {
    return { tenantId: "tenant-default", tenantName: "Default Tenant" };
  }
  return { tenantId: headerValue.trim(), tenantName: `Tenant (${headerValue.trim()})` };
}

export function buildAriaAttributes(label: string, describedBy?: string, invalid?: boolean): Record<string, string> {
  const attrs: Record<string, string> = {
    "aria-label": label,
  };
  if (describedBy) attrs["aria-describedby"] = describedBy;
  if (invalid !== undefined) attrs["aria-invalid"] = invalid ? "true" : "false";
  return attrs;
}
