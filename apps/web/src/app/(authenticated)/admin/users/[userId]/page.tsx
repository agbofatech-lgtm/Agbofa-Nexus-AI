"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { callRpc } from "../../../../../lib/bff/client";
import { UserForm } from "../../components/user-form";
import { RoleBadge } from "../../components/role-badge";
import { UserItem, UserFormDto, UserStatus, UserRole } from "../../types";

export interface UserDetailPageProps {
  params: {
    userId: string;
  };
}

const DEFAULT_USER_DETAIL: UserItem = {
  id: "usr-default",
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
};

export default function UserDetailPage({ params }: UserDetailPageProps): React.JSX.Element {
  const router = useRouter();
  const { userId } = params;

  const [user, setUser] = useState<UserItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showRoleConfirm, setShowRoleConfirm] = useState<UserRole | null>(null);
  const [showDangerModal, setShowDangerModal] = useState<"suspend" | "activate" | "delete" | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "error">("normal");

  const fetchUserDetail = useCallback(async () => {
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
        setError(resp.error?.message || "User account not found.");
        setUser(null);
      } else {
        setUser({
          ...DEFAULT_USER_DETAIL,
          id: userId,
          email: userId === "usr-default" ? DEFAULT_USER_DETAIL.email : `${userId}@agbofa.com`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
      setError(msg);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (simulateMode === "normal") {
      fetchUserDetail();
    }
  }, [fetchUserDetail, simulateMode]);

  const handleUpdateUser = (dto: UserFormDto) => {
    if (!user) return;
    setUser({
      ...user,
      name: dto.name,
      email: dto.email,
      tenantId: dto.tenantId,
      role: dto.role,
      status: dto.status,
    });
    alert(`User ${user.id} profile and role claims updated successfully!`);
  };

  const handleConfirmRoleChange = () => {
    if (!user || !showRoleConfirm) return;
    setUser({ ...user, role: showRoleConfirm });
    alert(`User ${user.id} RBAC role changed to ${showRoleConfirm}.`);
    setShowRoleConfirm(null);
  };

  const handleResetPassword = () => {
    if (!user) return;
    alert(`Password reset link dispatched to ${user.email}. Token valid for 24 hours.`);
  };

  const handleDangerAction = () => {
    if (!user) return;
    if (showDangerModal === "suspend") {
      setUser({ ...user, status: "SUSPENDED" as UserStatus });
      alert(`User account ${user.id} has been SUSPENDED.`);
    } else if (showDangerModal === "activate") {
      setUser({ ...user, status: "ACTIVE" as UserStatus });
      alert(`User account ${user.id} has been ACTIVATED.`);
    } else if (showDangerModal === "delete") {
      alert(`User account ${user.id} deleted from directory.`);
      router.push("/admin/users");
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
            onClick={() => router.push("/admin/users")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to User Directory
          </button>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-48 animate-pulse rounded-lg bg-[#12121A]" />
        <div className="h-96 animate-pulse rounded-lg bg-[#12121A]" />
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to User Directory
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
            {error || "User Account Not Found"}
          </h3>
          <p className="mb-6 text-xs text-[#A0A4A8]">
            We could not retrieve the requested user identity claims from TenantIdentityService.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              onClick={() => {
                if (simulateMode === "error") setSimulateMode("normal");
                else fetchUserDetail();
              }}
              className="rounded-md bg-[#0066CC] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/users")}
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
          onClick={() => router.push("/admin/users")}
          className="text-xs font-semibold text-[#3399FF] hover:underline"
        >
          ← Back to User Directory
        </button>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#A0A4A8]">User ID: {user.id}</span>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Activity Log & Stats Bar (3 columns) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Current RBAC Role
          </div>
          <div className="mt-2 flex items-center justify-between">
            <RoleBadge role={user.role} />
            <span className="text-xs text-[#3399FF]">Active Session</span>
          </div>
          <div className="mt-2 text-[11px] text-[#A0A4A8]">
            Tenant: {user.tenantId}
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Stories &amp; Content Edited
          </div>
          <div className="mt-2 text-2xl font-bold text-[#6C5CE7]">
            {user.storiesEdited}
          </div>
          <div className="text-[11px] text-[#A0A4A8]">Origination &amp; factory assets</div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Editorial Reviews Completed
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9040]">
            {user.reviewsCompleted}
          </div>
          <div className="text-[11px] text-[#A0A4A8]">
            Last active {new Date(user.lastActiveAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Quick Security & Role Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
        <div>
          <h3 className="text-sm font-bold text-[#FAFAFA]">
            Account Security &amp; Quick RBAC Role Change
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            Modify user permission claims or dispatch a secure credential reset link
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetPassword}
            className="rounded border border-[#0066CC] bg-[#0066CC]/10 px-3.5 py-1.5 text-xs font-semibold text-[#3399FF] hover:bg-[#0066CC]/20"
          >
            🔒 Send Password Reset Email
          </button>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-[#A0A4A8]">Change Role to:</span>
            {(["ADMIN", "EDITOR", "ANALYST", "READER"] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                disabled={r === user.role}
                onClick={() => setShowRoleConfirm(r)}
                className={`rounded px-2.5 py-1 text-[11px] font-bold border transition-colors ${
                  r === user.role
                    ? "border-[#2E2E32] bg-[#2E2E32]/40 text-[#A0A4A8] cursor-not-allowed"
                    : "border-[#0066CC]/50 bg-[#12121A] text-[#3399FF] hover:border-[#0066CC] hover:bg-[#0066CC]/10"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div>
        <UserForm
          initialData={user}
          onSubmit={handleUpdateUser}
          onCancel={() => router.push("/admin/users")}
          isEdit={true}
        />
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-[#CF2020]/40 bg-[#CF2020]/10 p-6">
        <h3 className="text-base font-bold text-[#CF2020]">
          Danger Zone — User Account Access &amp; Session Termination
        </h3>
        <p className="mt-1 text-xs text-[#FAFAFA]">
          Actions taken here immediately invalidate all active JWT tokens and sessions for this account.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {user.status === "ACTIVE" ? (
            <button
              type="button"
              onClick={() => setShowDangerModal("suspend")}
              className="rounded bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600"
            >
              ⚠ Suspend User Account
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowDangerModal("activate")}
              className="rounded bg-[#0D9040] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0D9040]/80"
            >
              ✓ Activate User Account
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDangerModal("delete")}
            className="rounded bg-[#CF2020] px-4 py-2 text-xs font-semibold text-white hover:bg-[#CF2020]/80"
          >
            ✕ Delete User Account Permanently
          </button>
        </div>
      </div>

      {/* Role Change Confirmation Modal */}
      {showRoleConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-bold text-[#FAFAFA]">
              Confirm RBAC Role Elevation / Modification
            </h3>
            <p className="mb-6 text-xs text-[#A0A4A8]">
              Are you sure you want to change role authorization for <span className="font-bold text-[#FAFAFA]">{user.name}</span> from <span className="font-bold text-[#3399FF]">{user.role}</span> to <span className="font-bold text-[#6C5CE7]">{showRoleConfirm}</span>? This immediately modifies their access permissions across all Agbofa Nexus AI workspaces.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowRoleConfirm(null)}
                className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                className="rounded bg-[#0066CC] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
              >
                ✓ Confirm Role Change
              </button>
            </div>
          </div>
        </div>
      )}

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
                ? "Confirm Account Suspension"
                : showDangerModal === "activate"
                ? "Confirm Account Activation"
                : "Confirm Account Deletion"}
            </h3>
            <p className="mb-6 text-xs text-[#A0A4A8]">
              {showDangerModal === "suspend"
                ? `Suspending ${user.email} immediately revokes active session claims and blocks dashboard logins.`
                : showDangerModal === "activate"
                ? `Activating ${user.email} restores full login access according to their RBAC role.`
                : `WARNING: Deleting account ${user.email} permanently removes their profile from the directory.`}
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
