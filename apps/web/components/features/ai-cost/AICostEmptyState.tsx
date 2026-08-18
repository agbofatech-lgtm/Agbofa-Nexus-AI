import { BusinessState } from "@/components/features/business/BusinessState";
export function AICostEmptyState() {
  return (
    <BusinessState
      message="No authoritative cost data exists. Connect an approved usage and billing contract."
      state="empty"
    />
  );
}
