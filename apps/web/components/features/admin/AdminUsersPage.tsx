"use client";
import { AdminHeader } from "@/components/features/admin/AdminHeader";
import { RoleManagement } from "@/components/features/admin/RoleManagement";
import { TenantContext } from "@/components/features/admin/TenantContext";
import { UserTable } from "@/components/features/admin/UserTable";
import { BusinessState } from "@/components/features/business/BusinessState";
import { DataStateBanner } from "@/components/features/business/DataStateBanner";
import { useBusinessModule } from "@/hooks/useBusinessModule";
export function AdminUsersPage() {
  const { value, retry } = useBusinessModule("admin");
  if (value.state === "loading")
    return (
      <>
        <AdminHeader title="User Management" />
        <BusinessState state="loading" />
      </>
    );
  if (value.state === "error")
    return (
      <BusinessState
        message={value.error ?? ""}
        onRetry={retry}
        state="error"
      />
    );
  if (!value.data) return <BusinessState state="empty" />;
  return (
    <main className="business-page">
      <AdminHeader
        subtitle="Inspect demo users and role labels. Backend authorization remains authoritative."
        title="User Management"
      />
      <DataStateBanner value={value} />
      <TenantContext tenant={value.data.currentTenant} />
      <div className="admin-grid">
        <UserTable users={value.data.users} />
        <RoleManagement />
      </div>
    </main>
  );
}
