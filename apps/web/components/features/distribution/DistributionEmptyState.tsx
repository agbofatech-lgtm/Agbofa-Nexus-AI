import { BusinessState } from "@/components/features/business/BusinessState";
export function DistributionEmptyState() {
  return (
    <BusinessState
      message="No authorized channels are available. Connection infrastructure is required."
      state="empty"
    />
  );
}
