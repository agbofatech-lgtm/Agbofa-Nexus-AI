import type { UserRole } from "@/types/auth";

/** UX mapping only. Never used as a security decision. */
export function presentRole(roles: string[] | undefined): UserRole {
  const canonical = (roles ?? []).map((role) => role.toUpperCase());
  if (canonical.includes("TENANT_OWNER") || canonical.includes("TENANT_ADMIN")) {
    return "admin";
  }
  if (canonical.includes("EDITOR")) {
    return "editor";
  }
  return "reader";
}
