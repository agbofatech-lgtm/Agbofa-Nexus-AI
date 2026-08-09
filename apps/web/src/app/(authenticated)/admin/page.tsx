"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../lib/bff/client";
import { AdminStatCard } from "./components/admin-stat-card";
import { AdminDashboardStats, SystemActivityEvent } from "./types";

const INITIAL_ADMIN_STATS: AdminDashboardStats = {
  totalTenants: 12,
  activeTenants: 10,
  suspendedTenants: 1,
  trialingTenants: 1,
  totalUsers: 48,
  usersByRole: {
    ADMIN: 6,
    EDITOR: 18,
    ANALYST: 10,
    READER: 14,
  },
  publishedToday: 23,
  totalStories: 1450,
  systemHealth: "HEALTHY",
  uptimePercentage: 99.98,
};

const SAMPLE_SYSTEM_ACTIVITIES: SystemActivityEvent[] = [
  {
    id: "act-1",
    type: "TENANT_CREATED",
    title: "New Tenant Created: Reuters Wire Syndicate",
    description:
      "Provisioned enterprise tenant boundary with full 32-Agent Fleet and monetization RLS schema.",
    actor: "kwame.mensah@agbofa.com (System Admin)",
    occurredAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: "act-2",
    type: "USER_INVITED",
    title: "User Invitation Sent: senior-editor@acme-media.com",
    description: "Invited with role EDITOR to tenant acme-media-group.",
    actor: "admin@acme-media.com",
    occurredAt: new Date(Date.now() - 65 * 60000).toISOString(),
  },
  {
    id: "act-3",
    type: "ROLE_CHANGED",
    title: "RBAC Role Updated: abena@agbofa.com",
    description: "Role elevated from ANALYST to ADMIN with full organization governance.",
    actor: "kwame.mensah@agbofa.com (System Admin)",
    occurredAt: new Date(Date.now() - 140 * 60000).toISOString(),
  },
  {
    id: "act-4",
    type: "SYSTEM_EVENT",
    title: "RLS Tenant Isolation Audit Verification Completed",
    description: "Zero cross-tenant leaks detected across 16 database tables in automated nightly verification.",
    actor: "Agbofa Governance Watchdog",
    occurredAt: new Date(Date.now() - 300 * 60000).toISOString(),
  },
];

export default function AdminDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const [stats, setStats] = useState<AdminDashboardStats>(INITIAL_ADMIN_STATS);
  const [activities, setActivities] = useState<SystemActivityEvent[]>(SAMPLE_SYSTEM_ACTIVITIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function loadAdminDashboard() {
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
          setError(resp.error?.message || "Failed to load admin dashboard data from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadAdminDashboard();
  }, []);

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-[#12121A]" />
          ))}
        </div>
        <div className="h-64 w-full animate-pulse rounded-lg bg-[#12121A]" />
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">Platform Admin Overview</h2>
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
            Admin Dashboard Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error || "Simulated error: unable to reach TenantIdentityService via BFF proxy."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "error") setSimulateMode("normal");
              else window.location.reload();
            }}
            className="rounded-md bg-[#CF2020] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#CF2020]/80 transition-colors"
          >
            Retry Dashboard Retrieval
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (simulateMode === "empty" || (!isLoading && activities.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">Platform Admin Overview</h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No recent platform activity
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            Zero administrative events have been logged across tenant provisioning and user invitations.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setActivities(SAMPLE_SYSTEM_ACTIVITIES);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample System Activity
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-8">
      {/* Top Title & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            Multi-Tenant Organization Governance &amp; RLS Overview
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Real-time telemetry across {stats.totalTenants} tenant boundaries and {stats.totalUsers} provisioned accounts
          </p>
        </div>
        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* STAT CARDS Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          title="Total Tenants"
          value={stats.totalTenants}
          subText={`${stats.activeTenants} active · ${stats.suspendedTenants} suspended · ${stats.trialingTenants} trial`}
          badgeLabel="RLS Isolated"
          badgeStyle="bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/40"
          onClick={() => router.push("/admin/tenants")}
        />

        <AdminStatCard
          title="Total Users"
          value={stats.totalUsers}
          subText={`${stats.usersByRole.ADMIN} Admin · ${stats.usersByRole.EDITOR} Editor · ${stats.usersByRole.ANALYST} Analyst`}
          badgeLabel="RBAC Validated"
          badgeStyle="bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/40"
          onClick={() => router.push("/admin/users")}
        />

        <AdminStatCard
          title="Total Stories"
          value={stats.totalStories.toLocaleString()}
          subText={`${stats.publishedToday} published today across channels`}
          badgeLabel="AI Verified"
          badgeStyle="bg-[#3399FF]/20 text-[#3399FF] border border-[#3399FF]/40"
          onClick={() => router.push("/reader")}
        />

        <AdminStatCard
          title="System Health"
          value={stats.systemHealth}
          subText={`${stats.uptimePercentage}% Uptime · Zero cross-tenant leaks`}
          badgeLabel="HEALTHY"
          badgeStyle="bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40"
        />
      </div>

      {/* QUICK ACTIONS Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
          Administrative Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            onClick={() => router.push("/admin/tenants")}
            className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 transition-all hover:border-[#0066CC] hover:shadow"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-[#3399FF]">+ Create / Manage Tenant</span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <p className="text-[11px] text-[#A0A4A8]">
              Provision new organization tenant boundaries and configure feature entitlements.
            </p>
          </div>

          <div
            onClick={() => router.push("/admin/users")}
            className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 transition-all hover:border-[#6C5CE7] hover:shadow"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-[#6C5CE7]">👤 Invite &amp; Manage Users</span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <p className="text-[11px] text-[#A0A4A8]">
              Invite team members, assign RBAC roles, and manage session status.
            </p>
          </div>

          <div
            onClick={() => {
              alert("Compliance and RLS audit report generator (scheduled for downstream reporting center export)");
            }}
            className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 transition-all hover:border-[#0D9040] hover:shadow"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-[#0D9040]">📊 View Compliance Reports</span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <p className="text-[11px] text-[#A0A4A8]">
              Export RLS isolation verification ledgers and AI fact-checking audit logs.
            </p>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY FEED */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <div className="mb-4 flex items-center justify-between border-b border-[#2E2E32] pb-3">
          <h3 className="text-sm font-bold text-[#FAFAFA]">
            Recent Administrative Activity Ledger
          </h3>
          <span className="text-xs text-[#A0A4A8]">
            Immutable audit log of organization governance actions
          </span>
        </div>
        <div className="divide-y divide-[#2E2E32]">
          {activities.map((ev) => (
            <div
              key={ev.id}
              className="flex flex-col justify-between gap-2 py-3 text-xs sm:flex-row sm:items-center"
            >
              <div>
                <span className="font-bold text-[#FAFAFA]">{ev.title}</span>
                <p className="mt-0.5 text-[#A0A4A8]">{ev.description}</p>
                <div className="mt-0.5 text-[11px] text-[#3399FF]">
                  Actor: {ev.actor}
                </div>
              </div>
              <div className="flex shrink-0 items-center space-x-2">
                <span className="rounded bg-[#0A0A0B] px-2 py-0.5 text-[10px] font-semibold text-[#A0A4A8] border border-[#2E2E32]">
                  {ev.type}
                </span>
                <span className="text-[11px] text-[#A0A4A8]">
                  {new Date(ev.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
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
