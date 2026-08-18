import { DataAuthorityBadge } from "@/components/features/business/DataAuthorityBadge";
import type { DataState } from "@/types/data-state";

export function DataStateBanner<T>({ value }: { value: DataState<T> }) {
  return (
    <div className="data-state-banner" role="note">
      <DataAuthorityBadge state={value.state} />
      <span>Source: {value.source}</span>
      <p>
        {value.state === "demo"
          ? "Values are isolated frontend fixtures and are not production business data."
          : value.state === "unavailable"
            ? "No verified backend capability exists in this checkout."
            : (value.error ?? "Data authority is shown explicitly.")}
      </p>
    </div>
  );
}
