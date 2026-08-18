import { BusinessHeader } from "@/components/features/business/BusinessHeader";
export function AdminHeader({
  title = "Administration",
  subtitle = "Tenant, user, role, settings, and audit visibility for frontend demonstration.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <BusinessHeader
      eyebrow="Tenant-aware administration"
      subtitle={subtitle}
      title={title}
    />
  );
}
