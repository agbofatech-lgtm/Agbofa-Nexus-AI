import { BusinessState } from "@/components/features/business/BusinessState";
export function DistributionErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return <BusinessState message={message} onRetry={onRetry} state="error" />;
}
