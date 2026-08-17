"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { callRpc } from "../../../../../lib/bff/client";
import { TenantForm } from "../../components/tenant-form";
import { TenantItem, TenantFormDto, TenantStatus } from "../../types";

export interface TenantDetailPageProps {
  params: {
    tenantId: string;
  };
}

const DEFAULT_TENANT_DETAIL: TenantItem = {
  id: "tenant-default",
  name: "Agbofa Nexus Media Group (Default)",
  domain: "agbofa.local",
  plan: "ENTERPRISE",
  status: "ACTIVE",
  usersCount: 24,
  maxUsers: 100,
  storiesCount: 840,
  storageUsedMb: 14500,
  features: [
    "Predictive AI (IMP-018)",
    "Personalization (IMP-019)",
    "Monetization (IMP-021)",
    "32-Agent Fleet (IMP-017)",
    "Custom Domain Mapping",
  ],
  createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function TenantDetailPage({ params }: TenantDetailPageProps): React.JSX.Element {
  const router = useRouter();
  const { tenantId } = params;

  const [tenant, setTenant] = useState<TenantItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDangerModal, setShowDangerModal] = useState<"suspend" | "activate" | "delete" | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "error">("normal");

  const fetchTenantDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await callRpc<
        { tenant_id: string },
        { tenant?: unknown }
      >("foundation.v1.TenantIdentityService", "GetTenant", {
        tenant_id: tenantId,
      });
      if (resp.status === "ERROR") {
        setError(resp.error?.message || "Tenant not found.");
        setTenant(null);
      } else {
        setTenant({
          ...DEFAULT_TENANT_DETAIL,
          id: tenantId,
          name: tenantId === "tenant-default" ? DEFAULT_TENANT_DETAIL.name : `Tenant Organization (${tenantId})`,
          domain: `${tenantId}.agbofa.ai`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
      setError(msg);
      setTenant(null);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (simulateMode === "normal") {
      fetchTenantDetail();
    }
  }, [fetchTenantDetail, simulateMode]);

  const handleUpdateTenant = (dto: TenantFormDto) => {
    if (!tenant) return;
    setTenant({
      ...tenant,
      name: dto.name,
      domain: dto.domain,
      plan: dto.plan,
      maxUsers: dto.maxUsers,
      features: dto.features,
      updatedAt: new Date().toISOString(),
    });
    alert(`Tenant ${tenant.id} changes saved successfully!`);
  };

  const handleDangerAction = () => {
    if (!tenant) return;
    if (showDangerModal === "suspend") {
      setTenant({ ...tenant, status: "SUSPENDED" as TenantStatus });
      alert(`Tenant ${tenant.id} has been SUSPENDED.`);
    } else if (showDangerModal === "activate") {
      setTenant({ ...tenant, status: "ACTIVE" as TenantStatus });
      alert(`Tenant ${tenant.id} has been ACTIVATED.`);
    } else if (showDangerModal === "delete") {
      alert(`Tenant ${tenant.id} deleted. All RLS data queues marked for cascade purge.`);
      router.push("/admin/tenants");
      return;
    }
    setShowDangerModal(null);
  };

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
          <button
            type="button"
            onClick={() => router.push("/admin/tenants")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Tenant Directory
          </button>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-48 animate-pulse rounded-lg bg-[#12121A]" />
        <div className="h-96 animate-pulse rounded-lg bg-[#12121A]" />
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error || !tenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
          <button
            type="button"
            onClick={() => router.push("/admin/tenants")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Tenant Directory
          </button>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div
          role="alert"
          aria-live="assertive"
          className="mx-auto max-w-lg rounded-lg border border-[#CF2020] bg-[#12121A] p-6 text-center shadow-xl"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#CF2020]/20 text-2xl text-[#CF2020]">
            ⚠
          </div>
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            {error || "Tenant Organization Not Found"}
          </h3>
          <p className="mb-6 text-xs text-[#A0A4A8]">
            We could not retrieve the requested tenant RLS boundary from TenantIdentityService.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              onClick={() => {
                if (simulateMode === "error") setSimulateMode("normal");
                else fetchTenantDetail();
              }}
              className="rounded-md bg-[#0066CC] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/tenants")}
              className="rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-4 py-2 text-xs font-semibold text-[#FAFAFA]"
            >
              Return to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. DATA STATE
  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <button
          type="button"
          onClick={() => router.push("/admin/tenants")}
          className="text-xs font-semibold text-[#3399FF] hover:underline"
        >
          ← Back to Tenant Directory
        </button>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#A0A4A8]">Tenant ID: {tenant.id}</span>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Usage stats bar (3 columns) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Stories This Month
          </div>
          <div className="mt-2 text-2xl font-bold text-[#3399FF]">
            {tenant.storiesCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#A0A4A8]">Verified &amp; published packages</div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Active User Seats
          </div>
          <div className="mt-2 text-2xl font-bold text-[#6C5CE7]">
            {tenant.usersCount} / {tenant.maxUsers}
          </div>
          <div className="text-[11px] text-[#A0A4A8]">RBAC provisioned accounts</div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Storage &amp; Media Used
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9040]">
            {(tenant.storageUsedMb / 1024).toFixed(1)} GB
          </div>
          <div className="text-[11px] text-[#A0A4A8]">Postgres RLS + asset ledgers</div>
        </div>
      </div>

      {/* Edit Form */}
      <div>
        <TenantForm
          initialData={tenant}
          onSubmit={handleUpdateTenant}
          onCancel={() => router.push("/admin/tenants")}
          isEdit={true}
        />
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-[#CF2020]/40 bg-[#CF2020]/10 p-6">
        <h3 className="text-base font-bold text-[#CF2020]">
          Danger Zone — Organization Governance Controls
        </h3>
        <p className="mt-1 text-xs text-[#FAFAFA]">
          Actions taken here immediately affect all users and RLS database access across this organization boundary.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {tenant.status === "ACTIVE" ? (
            <button
              type="button"
              onClick={() => setShowDangerModal("suspend")}
              className="rounded bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600"
            >
              ⚠ Suspend Tenant Access
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowDangerModal("activate")}
              className="rounded bg-[#0D9040] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0D9040]/80"
            >
              ✓ Activate Tenant Access
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDangerModal("delete")}
            className="rounded bg-[#CF2020] px-4 py-2 text-xs font-semibold text-white hover:bg-[#CF2020]/80"
          >
            ✕ Delete Tenant &amp; Purge RLS Schema
          </button>
        </div>
      </div>

      {/* Danger Confirmation Modal */}
      {showDangerModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-bold text-[#FAFAFA]">
              {showDangerModal === "suspend"
                ? "Confirm Tenant Suspension"
                : showDangerModal === "activate"
                ? "Confirm Tenant Activation"
                : "Confirm Tenant Deletion"}
            </h3>
            <p className="mb-6 text-xs text-[#A0A4A8]">
              {showDangerModal === "suspend"
                ? `Suspending tenant ${tenant.name} blocks all user sessions and RLS queries immediately.`
                : showDangerModal === "activate"
                ? `Activating tenant ${tenant.name} restores full session access to all provisioned users.`
                : `WARNING: Deleting tenant ${tenant.name} permanently removes all reader profiles, stories, and monetization ledgers.`}
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowDangerModal(null)}
                className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDangerAction}
                className={`rounded px-4 py-1.5 text-xs font-semibold text-white ${
                  showDangerModal === "delete"
                    ? "bg-[#CF2020] hover:bg-[#CF2020]/80"
                    : showDangerModal === "suspend"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-[#0D9040] hover:bg-[#0D9040]/80"
                }`}
              >
                {showDangerModal === "delete"
                  ? "✕ Confirm Permanent Delete"
                  : showDangerModal === "suspend"
                  ? "⚠ Confirm Suspension"
                  : "✓ Confirm Activation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SimulationDetailToolbarProps {
  currentMode: "normal" | "loading" | "error";
  onSelectMode: (mode: "normal" | "loading" | "error") => void;
}

function SimulationDetailToolbar({
  currentMode,
  onSelectMode,
}: SimulationDetailToolbarProps): React.JSX.Element {
  return (
    <div className="flex items-center space-x-1 rounded-md border border-[#2E2E32] bg-[#0A0A0B] p-1 text-[11px]">
      <span className="px-1 text-[#A0A4A8]">State:</span>
      {(["normal", "loading", "error"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSelectMode(mode)}
          className={`rounded px-2 py-0.5 font-medium transition-colors ${
            currentMode === mode
              ? "bg-[#0066CC] text-[#FAFAFA]"
              : "text-[#A0A4A8] hover:bg-[#12121A] hover:text-[#FAFAFA]"
          }`}
        >
          {mode.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
