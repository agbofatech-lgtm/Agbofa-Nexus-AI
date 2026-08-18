import { Building2, ShieldCheck } from "lucide-react";
import type { AdminData } from "@/types/business";
export function TenantContext({
  tenant,
}: {
  tenant: AdminData["currentTenant"];
}) {
  return (
    <div className="tenant-context glass-gold">
      <span>
        <Building2 size={18} />
      </span>
      <div>
        <small>CURRENT TENANT</small>
        <strong>{tenant.name}</strong>
        <p>
          {tenant.id} · {tenant.environment}
        </p>
      </div>
      <aside>
        <ShieldCheck size={13} />
        {tenant.role} · UX visibility only
      </aside>
    </div>
  );
}
