"use client";
import { AdminHeader } from "@/components/features/admin/AdminHeader";
import { TenantContext } from "@/components/features/admin/TenantContext";
import { TenantTable } from "@/components/features/admin/TenantTable";
import { BusinessState } from "@/components/features/business/BusinessState";
import { DataStateBanner } from "@/components/features/business/DataStateBanner";
import { useBusinessModule } from "@/hooks/useBusinessModule";
export function AdminTenantsPage() {
  const { value, retry } = useBusinessModule("admin");
  if (value.state === "loading")
    return (
      <>
        <AdminHeader title="Tenant Management" />
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
    <div className="business-page">
      <AdminHeader
        subtitle="View isolated demo tenant context without implementing backend tenancy."
        title="Tenant Management"
      />
      <DataStateBanner value={value} />
      <TenantContext tenant={value.data.currentTenant} />
      <TenantTable tenants={value.data.tenants} />
    </div>
  );
}
