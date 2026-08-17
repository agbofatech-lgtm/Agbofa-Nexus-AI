/**
 * Agbofa Nexus AI — Enterprise Form State & Mutation Safeguards (IMP-015)
 * Enforces typed inputs, server validation awareness, loading/error states, and destructive action confirmation.
 */

export type FormStateStatus = "IDLE" | "SUBMITTING" | "SUCCESS" | "VALIDATION_ERROR" | "SERVER_ERROR";

export interface EnterpriseFormState<T> {
  tenantId: string;
  data: T;
  status: FormStateStatus;
  errorMessage?: string;
  requiresDestructiveConfirmation: boolean;
  destructiveConfirmed: boolean;
}

export function createEnterpriseForm<T>(tenantId: string, initialData: T, requiresDestructive = false): EnterpriseFormState<T> {
  if (!tenantId) {
    throw new Error("cross_tenant_violation: form tenant_id required");
  }
  return {
    tenantId,
    data: initialData,
    status: "IDLE",
    requiresDestructiveConfirmation: requiresDestructive,
    destructiveConfirmed: false,
  };
}

export function canSubmitForm<T>(form: EnterpriseFormState<T>): boolean {
  if (form.status === "SUBMITTING") return false;
  if (form.requiresDestructiveConfirmation && !form.destructiveConfirmed) return false;
  return true;
}
