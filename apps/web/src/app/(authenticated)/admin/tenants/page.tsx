"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { TenantForm } from "../components/tenant-form";
import { TenantItem, TenantFormDto } from "../types";

const INITIAL_TENANTS: TenantItem[] = [
  {
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
    ],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "tenant-reuters-01",
    name: "Reuters Wire Syndicate",
    domain: "reuters.agbofa.ai",
    plan: "ENTERPRISE",
    status: "ACTIVE",
    usersCount: 15,
    maxUsers: 50,
    storiesCount: 420,
    storageUsedMb: 8200,
    features: [
      "Predictive AI (IMP-018)",
      "32-Agent Fleet (IMP-017)",
    ],
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "tenant-trial-03",
    name: "Emerging Media Venture",
    domain: "emerging.agbofa.ai",
    plan: "FREE",
    status: "TRIALING",
    usersCount: 3,
    maxUsers: 5,
    storiesCount: 18,
    storageUsedMb: 450,
    features: ["Predictive AI (IMP-018)"],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "tenant-susp-04",
    name: "Inactive Publishing Firm",
    domain: "inactive.agbofa.ai",
    plan: "PREMIUM",
    status: "SUSPENDED",
    usersCount: 6,
    maxUsers: 20,
    storiesCount: 172,
    storageUsedMb: 3100,
    features: ["Personalization (IMP-019)"],
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

function getStatusBadge(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40";
    case "TRIALING":
      return "bg-[#3399FF]/20 text-[#3399FF] border border-[#3399FF]/40";
    case "SUSPENDED":
    default:
      return "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40";
  }
}

function getPlanBadge(plan: string): string {
  switch (plan) {
    case "ENTERPRISE":
      return "bg-[#6C5CE7]/20 text-[#6C5CE7] font-bold border border-[#6C5CE7]/30";
    case "PREMIUM":
      return "bg-[#0066CC]/20 text-[#3399FF] font-semibold border border-[#0066CC]/30";
    case "FREE":
    default:
      return "bg-[#2E2E32]/60 text-[#A0A4A8] border border-[#2E2E32]";
  }
}

export default function TenantListPage(): React.JSX.Element {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantItem[]>(INITIAL_TENANTS);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function fetchTenants() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string },
          { tenant?: unknown }
        >("foundation.v1.TenantIdentityService", "GetTenant", {
          tenant_id: "tenant-default",
        });
        if (resp.status === "ERROR") {
          setError(resp.error?.message || "Failed to load tenant directory from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTenants();
  }, []);

  const handleCreateTenant = (dto: TenantFormDto) => {
    const newTenant: TenantItem = {
      id: `tenant-${dto.domain.split(".")[0] || Date.now()}`,
      name: dto.name,
      domain: dto.domain,
      plan: dto.plan,
      status: "ACTIVE",
      usersCount: 1,
      maxUsers: dto.maxUsers,
      storiesCount: 0,
      storageUsedMb: 0,
      features: dto.features,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTenants([newTenant, ...tenants]);
    setShowCreateModal(false);
  };

  const filteredTenants = tenants.filter((ten) => {
    if (
      searchQuery.trim() &&
      !ten.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !ten.domain.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (statusFilter !== "ALL" && ten.status !== statusFilter) {
      return false;
    }
    if (planFilter !== "ALL" && ten.plan !== planFilter) {
      return false;
    }
    return true;
  });

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-[#12121A]" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[#12121A]" />
          ))}
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">Tenant Directory</h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
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
            Tenant Directory Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error || "Simulated error: unable to reach TenantIdentityService via BFF."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "error") setSimulateMode("normal");
              else window.location.reload();
            }}
            className="rounded-md bg-[#CF2020] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#CF2020]/80 transition-colors"
          >
            Retry Retrieval
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (
    simulateMode === "empty" ||
    (!isLoading && filteredTenants.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              Organization Tenant Directory
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              Manage organization boundaries, domain keys, and RLS schema separation
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Search / Filter bar still visible */}
        <TenantFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          planFilter={planFilter}
          onPlanChange={setPlanFilter}
          onReset={() => {
            setSearchQuery("");
            setStatusFilter("ALL");
            setPlanFilter("ALL");
          }}
          onCreate={() => setShowCreateModal(true)}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No tenant organizations match your search
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {searchQuery || statusFilter !== "ALL" || planFilter !== "ALL"
              ? "Zero organization tenants match your search query, plan tier, or status filter."
              : "Zero tenants are currently provisioned in the directory."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setSearchQuery("");
                setStatusFilter("ALL");
                setPlanFilter("ALL");
                setTenants(INITIAL_TENANTS);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Reset Search &amp; Load Tenants
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Organization Tenant Directory ({filteredTenants.length} organizations)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative RLS tenant boundaries, subscription plans, and active feature modules
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded-md bg-[#0066CC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3399FF] shadow"
          >
            + Create New Tenant
          </button>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <TenantFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        planFilter={planFilter}
        onPlanChange={setPlanFilter}
        onReset={() => {
          setSearchQuery("");
          setStatusFilter("ALL");
          setPlanFilter("ALL");
        }}
        onCreate={() => setShowCreateModal(true)}
      />

      {/* Tenant Table (desktop) / Card List (mobile) */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] shadow">
        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#2E2E32] bg-[#0A0A0B] text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
                <th className="px-4 py-3">Organization Name &amp; Domain</th>
                <th className="px-4 py-3">Plan Tier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Users (Seats)</th>
                <th className="px-4 py-3 text-right">Stories</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E32]">
              {filteredTenants.map((ten) => (
                <tr
                  key={ten.id}
                  onClick={() => router.push(`/admin/tenants/${ten.id}`)}
                  className="group cursor-pointer transition-colors hover:bg-[#0066CC]/10"
                >
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#FAFAFA] group-hover:text-[#3399FF]">
                      {ten.name}
                    </div>
                    <div className="text-xs font-mono text-[#A0A4A8]">
                      {ten.domain} · ID: {ten.id}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${getPlanBadge(
                        ten.plan,
                      )}`}
                    >
                      {ten.plan}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusBadge(
                        ten.status,
                      )}`}
                    >
                      {ten.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-[#FAFAFA]">
                    <span className="font-bold">{ten.usersCount}</span> / {ten.maxUsers}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-[#FAFAFA]">
                    {ten.storiesCount.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[#A0A4A8]">
                    {new Date(ten.createdAt).toLocaleDateString()}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/tenants/${ten.id}`)}
                      className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC] hover:text-[#3399FF]"
                    >
                      Manage →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-[#2E2E32] md:hidden">
          {filteredTenants.map((ten) => (
            <div
              key={ten.id}
              onClick={() => router.push(`/admin/tenants/${ten.id}`)}
              className="flex flex-col space-y-2 p-4 transition-colors hover:bg-[#0066CC]/10"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${getPlanBadge(
                    ten.plan,
                  )}`}
                >
                  {ten.plan}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(
                    ten.status,
                  )}`}
                >
                  {ten.status}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#FAFAFA]">{ten.name}</h4>
              <div className="text-xs font-mono text-[#A0A4A8]">{ten.domain}</div>
              <div className="flex items-center justify-between pt-2 text-xs text-[#A0A4A8]">
                <span>Users: {ten.usersCount}/{ten.maxUsers}</span>
                <span>Stories: {ten.storiesCount}</span>
                <span className="font-semibold text-[#3399FF]">Manage →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-2xl">
            <TenantForm
              onSubmit={handleCreateTenant}
              onCancel={() => setShowCreateModal(false)}
              isEdit={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface TenantFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  planFilter: string;
  onPlanChange: (val: string) => void;
  onReset: () => void;
  onCreate: () => void;
}

function TenantFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  planFilter,
  onPlanChange,
  onReset,
}: TenantFilterBarProps): React.JSX.Element {
  const isFiltered =
    searchQuery.trim() !== "" || statusFilter !== "ALL" || planFilter !== "ALL";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or domain..."
          className="w-56 rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1.5 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
        />

        {/* Status Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="TRIALING">TRIALING</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>

        {/* Plan Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Plan:</label>
          <select
            value={planFilter}
            onChange={(e) => onPlanChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Plans</option>
            <option value="FREE">FREE</option>
            <option value="PREMIUM">PREMIUM</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
        </div>
      </div>

      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
        >
          ✕ Clear Filters
        </button>
      )}
    </div>
  );
}

interface SimulationToolbarProps {
  currentMode: "normal" | "loading" | "empty" | "error";
  onSelectMode: (mode: "normal" | "loading" | "empty" | "error") => void;
}

function SimulationToolbar({ currentMode, onSelectMode }: SimulationToolbarProps): React.JSX.Element {
  return (
    <div className="flex items-center space-x-1 rounded-md border border-[#2E2E32] bg-[#0A0A0B] p-1 text-[11px]">
      <span className="px-1 text-[#A0A4A8]">State:</span>
      {(["normal", "loading", "empty", "error"] as const).map((mode) => (
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
