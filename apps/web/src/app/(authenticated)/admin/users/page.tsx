"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { UserForm } from "../components/user-form";
import { RoleBadge } from "../components/role-badge";
import { UserItem, UserFormDto } from "../types";

const INITIAL_USERS: UserItem[] = [
  {
    id: "usr-101",
    name: "Kwame Mensah",
    email: "kwame.mensah@agbofa.com",
    tenantId: "tenant-default",
    tenantName: "Agbofa Nexus Media Group (Default)",
    role: "ADMIN",
    status: "ACTIVE",
    lastActiveAt: new Date(Date.now() - 5 * 60000).toISOString(),
    storiesEdited: 45,
    reviewsCompleted: 112,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "usr-102",
    name: "Abena Osei",
    email: "abena.osei@agbofa.com",
    tenantId: "tenant-default",
    tenantName: "Agbofa Nexus Media Group (Default)",
    role: "EDITOR",
    status: "ACTIVE",
    lastActiveAt: new Date(Date.now() - 15 * 60000).toISOString(),
    storiesEdited: 88,
    reviewsCompleted: 240,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: "usr-103",
    name: "Kofi Appiah",
    email: "kofi.appiah@reuters-syndicate.ai",
    tenantId: "tenant-reuters-01",
    tenantName: "Reuters Wire Syndicate",
    role: "ANALYST",
    status: "ACTIVE",
    lastActiveAt: new Date(Date.now() - 120 * 60000).toISOString(),
    storiesEdited: 12,
    reviewsCompleted: 0,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "usr-104",
    name: "Akosua Boateng",
    email: "akosua.boateng@acme-media.com",
    tenantId: "tenant-default",
    tenantName: "Agbofa Nexus Media Group (Default)",
    role: "READER",
    status: "INVITED",
    lastActiveAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    storiesEdited: 0,
    reviewsCompleted: 0,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "usr-105",
    name: "Yaw Asante",
    email: "yaw.asante@agbofa.com",
    tenantId: "tenant-default",
    tenantName: "Agbofa Nexus Media Group (Default)",
    role: "EDITOR",
    status: "SUSPENDED",
    lastActiveAt: new Date(Date.now() - 200 * 3600000).toISOString(),
    storiesEdited: 30,
    reviewsCompleted: 15,
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
];

function getStatusBadge(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40";
    case "INVITED":
      return "bg-[#3399FF]/20 text-[#3399FF] border border-[#3399FF]/40";
    case "SUSPENDED":
    default:
      return "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40";
  }
}

export default function UserListPage(): React.JSX.Element {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tenantFilter, setTenantFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function fetchUsers() {
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
          setError(resp.error?.message || "Failed to load user accounts from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleInviteUser = (dto: UserFormDto) => {
    const newUser: UserItem = {
      id: `usr-${Date.now()}`,
      name: dto.name,
      email: dto.email,
      tenantId: dto.tenantId,
      tenantName:
        dto.tenantId === "tenant-reuters-01"
          ? "Reuters Wire Syndicate"
          : "Agbofa Nexus Media Group (Default)",
      role: dto.role,
      status: dto.status,
      lastActiveAt: new Date().toISOString(),
      storiesEdited: 0,
      reviewsCompleted: 0,
      createdAt: new Date().toISOString(),
    };
    setUsers([newUser, ...users]);
    setShowInviteModal(false);
  };

  const filteredUsers = users.filter((u) => {
    if (
      searchQuery.trim() &&
      !u.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !u.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (tenantFilter !== "ALL" && u.tenantId !== tenantFilter) {
      return false;
    }
    if (roleFilter !== "ALL" && u.role !== roleFilter) {
      return false;
    }
    if (statusFilter !== "ALL" && u.status !== statusFilter) {
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
          {[1, 2, 3, 4, 5].map((i) => (
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">User Account Directory</h2>
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
            User Directory Retrieval Failed
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
    (!isLoading && filteredUsers.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              User Account Directory &amp; RBAC Roles
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              Provision user seats, invite team members, and assign role authorization claims
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter Bar still visible */}
        <UserFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          tenantFilter={tenantFilter}
          onTenantChange={setTenantFilter}
          roleFilter={roleFilter}
          onRoleChange={setRoleFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onReset={() => {
            setSearchQuery("");
            setTenantFilter("ALL");
            setRoleFilter("ALL");
            setStatusFilter("ALL");
          }}
          onInvite={() => setShowInviteModal(true)}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No user accounts match your filters
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {searchQuery ||
            tenantFilter !== "ALL" ||
            roleFilter !== "ALL" ||
            statusFilter !== "ALL"
              ? "Zero user accounts match your search query, tenant organization, role, or status filter."
              : "Zero user accounts are currently provisioned in the directory."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setSearchQuery("");
                setTenantFilter("ALL");
                setRoleFilter("ALL");
                setStatusFilter("ALL");
                setUsers(INITIAL_USERS);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Reset Search &amp; Load Users
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
            User Account Directory &amp; RBAC Roles ({filteredUsers.length} users)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Manage user seats, tenant organization assignments, and role authorization across Agbofa Nexus AI
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="rounded-md bg-[#0066CC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3399FF] shadow"
          >
            + Invite User
          </button>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Filter Bar */}
      <UserFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        tenantFilter={tenantFilter}
        onTenantChange={setTenantFilter}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onReset={() => {
          setSearchQuery("");
          setTenantFilter("ALL");
          setRoleFilter("ALL");
          setStatusFilter("ALL");
        }}
        onInvite={() => setShowInviteModal(true)}
      />

      {/* Users Table (Desktop) / Cards (Mobile) */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] shadow">
        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#2E2E32] bg-[#0A0A0B] text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
                <th className="px-4 py-3">User Name &amp; Email</th>
                <th className="px-4 py-3">Tenant Organization</th>
                <th className="px-4 py-3">RBAC Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E32]">
              {filteredUsers.map((usr) => (
                <tr
                  key={usr.id}
                  onClick={() => router.push(`/admin/users/${usr.id}`)}
                  className="group cursor-pointer transition-colors hover:bg-[#0066CC]/10"
                >
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#FAFAFA] group-hover:text-[#3399FF]">
                      {usr.name}
                    </div>
                    <div className="text-xs text-[#A0A4A8]">{usr.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#FAFAFA]">
                    <div className="font-medium">{usr.tenantName}</div>
                    <div className="font-mono text-[11px] text-[#A0A4A8]">
                      ID: {usr.tenantId}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <RoleBadge role={usr.role} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusBadge(
                        usr.status,
                      )}`}
                    >
                      {usr.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[#A0A4A8]">
                    {new Date(usr.lastActiveAt).toLocaleString()}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/users/${usr.id}`)}
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
          {filteredUsers.map((usr) => (
            <div
              key={usr.id}
              onClick={() => router.push(`/admin/users/${usr.id}`)}
              className="flex flex-col space-y-2 p-4 transition-colors hover:bg-[#0066CC]/10"
            >
              <div className="flex items-center justify-between">
                <RoleBadge role={usr.role} />
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(
                    usr.status,
                  )}`}
                >
                  {usr.status}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#FAFAFA]">{usr.name}</h4>
              <div className="text-xs text-[#A0A4A8]">{usr.email}</div>
              <div className="flex items-center justify-between pt-2 text-xs text-[#A0A4A8]">
                <span>Tenant: {usr.tenantId}</span>
                <span className="font-semibold text-[#3399FF]">Manage →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-2xl">
            <UserForm
              onSubmit={handleInviteUser}
              onCancel={() => setShowInviteModal(false)}
              isEdit={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface UserFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  tenantFilter: string;
  onTenantChange: (val: string) => void;
  roleFilter: string;
  onRoleChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  onReset: () => void;
  onInvite: () => void;
}

function UserFilterBar({
  searchQuery,
  onSearchChange,
  tenantFilter,
  onTenantChange,
  roleFilter,
  onRoleChange,
  statusFilter,
  onStatusChange,
  onReset,
}: UserFilterBarProps): React.JSX.Element {
  const isFiltered =
    searchQuery.trim() !== "" ||
    tenantFilter !== "ALL" ||
    roleFilter !== "ALL" ||
    statusFilter !== "ALL";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or email..."
          className="w-56 rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1.5 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
        />

        {/* Tenant Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Tenant:</label>
          <select
            value={tenantFilter}
            onChange={(e) => onTenantChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Tenants</option>
            <option value="tenant-default">Agbofa Nexus Media Group</option>
            <option value="tenant-reuters-01">Reuters Wire Syndicate</option>
          </select>
        </div>

        {/* Role Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => onRoleChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="EDITOR">EDITOR</option>
            <option value="ANALYST">ANALYST</option>
            <option value="READER">READER</option>
          </select>
        </div>

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
            <option value="INVITED">INVITED</option>
            <option value="SUSPENDED">SUSPENDED</option>
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
