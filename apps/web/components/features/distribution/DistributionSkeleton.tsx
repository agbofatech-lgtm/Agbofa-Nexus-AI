import { BusinessState } from "@/components/features/business/BusinessState";
export function DistributionSkeleton() {
  return <BusinessState state="loading" />;
}
