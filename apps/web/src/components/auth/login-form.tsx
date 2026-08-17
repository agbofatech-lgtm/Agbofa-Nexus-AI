"use client";

import React, { useState } from "react";
import { useSession } from "./session-provider";
import { Logo } from "../brand/logo";

export interface LoginFormProps {
  onSuccess?: () => void;
  defaultTenantName?: string;
}

export function LoginForm({
  onSuccess,
  defaultTenantName = "tenant-default",
}: LoginFormProps): React.JSX.Element {
  const { login, error, clearError } = useSession();
  const [tenantName, setTenantName] = useState(defaultTenantName);
  const [principalName, setPrincipalName] = useState("");
  const [credential, setCredential] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    const trimmedTenant = tenantName.trim();
    const trimmedPrincipal = principalName.trim();

    if (!trimmedTenant) {
      setValidationError("Tenant Name is required.");
      return;
    }
    if (!trimmedPrincipal) {
      setValidationError("Principal Name / User ID is required.");
      return;
    }
    if (!credential) {
      setValidationError("Credential is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await login(trimmedTenant, trimmedPrincipal, credential);
      if (success && onSuccess) {
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = validationError || error;

  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-xl sm:p-8">
      <div className="mb-6 flex flex-col items-center">
        <Logo compact={false} theme="dark" className="mb-2" />
        <h2 className="text-xl font-bold text-[#FAFAFA]">Sign in to Agbofa Nexus AI</h2>
        <p className="text-xs text-[#A0A4A8]">
          Enter your authoritative tenant identity and credentials
        </p>
      </div>

      {activeError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 w-full rounded-md border border-[#CF2020] bg-[#CF2020]/10 p-3 text-xs text-[#CF2020]"
        >
          <span className="font-semibold">Authentication Error: </span>
          {activeError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
        <div>
          <label
            htmlFor="tenant_name"
            className="mb-1 block text-xs font-semibold text-[#FAFAFA]"
          >
            Tenant Name
          </label>
          <input
            id="tenant_name"
            name="tenant_name"
            type="text"
            required
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder="e.g. tenant-default"
            disabled={isSubmitting}
            className="w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-sm text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none focus:ring-1 focus:ring-[#0066CC] disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="principal_name"
            className="mb-1 block text-xs font-semibold text-[#FAFAFA]"
          >
            Principal Name / Username
          </label>
          <input
            id="principal_name"
            name="principal_name"
            type="text"
            required
            value={principalName}
            onChange={(e) => setPrincipalName(e.target.value)}
            placeholder="e.g. editor@agbofa.com"
            disabled={isSubmitting}
            className="w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-sm text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none focus:ring-1 focus:ring-[#0066CC] disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="credential"
            className="mb-1 block text-xs font-semibold text-[#FAFAFA]"
          >
            Credential / Password
          </label>
          <input
            id="credential"
            name="credential"
            type="password"
            required
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            placeholder="••••••••"
            disabled={isSubmitting}
            className="w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-sm text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none focus:ring-1 focus:ring-[#0066CC] disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-[#0066CC] px-4 py-2.5 text-sm font-semibold text-[#FAFAFA] shadow hover:bg-[#3399FF] focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 focus:ring-offset-[#12121A] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#FAFAFA] border-t-transparent" />
              Authenticating...
            </span>
          ) : (
            "Authenticate Identity"
          )}
        </button>
      </form>
    </div>
  );
}
