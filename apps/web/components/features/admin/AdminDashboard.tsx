"use client";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AdminHeader } from "@/components/features/admin/AdminHeader";
import { AdminSettings } from "@/components/features/admin/AdminSettings";
import { AuditLog } from "@/components/features/admin/AuditLog";
import { RoleManagement } from "@/components/features/admin/RoleManagement";
import { TenantContext } from "@/components/features/admin/TenantContext";
import { BusinessMetric } from "@/components/features/business/BusinessMetric";
import { BusinessState } from "@/components/features/business/BusinessState";
import { DataStateBanner } from "@/components/features/business/DataStateBanner";
import { useBusinessModule } from "@/hooks/useBusinessModule";
export function AdminDashboard() {
  const { value, retry } = useBusinessModule("admin");
  if (value.state === "loading")
    return (
      <>
        <AdminHeader />
        <BusinessState state="loading" />
      </>
    );
  if (value.state === "error")
    return (
      <>
        <AdminHeader />
        <BusinessState
          message={value.error ?? ""}
          onRetry={retry}
          state="error"
        />
      </>
    );
  if (!value.data)
    return (
      <>
        <AdminHeader />
        <BusinessState state="empty" />
      </>
    );
  const d = value.data;
  return (
    <main className="business-page">
      <AdminHeader />
      <DataStateBanner value={value} />
      <TenantContext tenant={d.currentTenant} />
      <section className="business-metric-grid">
        <BusinessMetric
          detail="Demo tenant fixtures"
          icon={Building2}
          label="Tenants"
          value={String(d.tenants.length)}
        />
        <BusinessMetric
          detail="Current demo tenant users"
          icon={Users}
          label="Users"
          tone="blue"
          value={String(d.users.length)}
        />
        <BusinessMetric
          detail="Available UX role labels"
          icon={ShieldCheck}
          label="Roles"
          tone="purple"
          value="5"
        />
        <BusinessMetric
          detail="Demo audit records"
          icon={ScrollText}
          label="Audit events"
          tone="green"
          value={String(d.audit.length)}
        />
      </section>
      <nav className="admin-route-cards">
        <Link href="/admin/tenants">
          <Building2 size={18} />
          <span>
            <strong>Tenant management</strong>
            <small>View isolated demo tenants</small>
          </span>
          <ArrowRight size={14} />
        </Link>
        <Link href="/admin/users">
          <Users size={18} />
          <span>
            <strong>User management</strong>
            <small>View demo users and roles</small>
          </span>
          <ArrowRight size={14} />
        </Link>
      </nav>
      <div className="admin-grid">
        <RoleManagement />
        <AdminSettings initial={d.settings} />
      </div>
      <AuditLog items={d.audit} />
    </main>
  );
}
