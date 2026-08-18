import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import type { DataState } from "@/types/data-state";
export function DataStateBanner<T>({ value }: { value: DataState<T> }) {
  return (
    <aside className="data-state-banner" aria-label="Data source information">
      <div>
        <strong>{value.provenance.label}</strong>
        <p>
          {value.state === "unavailable"
            ? "Available when an authoritative integration is connected."
            : value.state === "error"
              ? (value.error ?? "Data source unavailable.")
              : "Presentation is ready for the authoritative adapter when available."}
        </p>
      </div>
      <DataSourceIndicator details provenance={value.provenance} />
    </aside>
  );
}
