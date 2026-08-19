import {
  CircleHelp,
  DatabaseZap,
  FileInput,
  FlaskConical,
  Radio,
  UserRound,
} from "lucide-react";
import type { DataProvenance, DataSource } from "@/types/data-state";
const icons: Record<DataSource, typeof Radio> = {
  live: Radio,
  mock: FlaskConical,
  estimated: CircleHelp,
  manual: UserRound,
  external: FileInput,
  unavailable: DatabaseZap,
};
export function DataSourceIndicator({
  provenance,
  details = false,
}: {
  provenance: DataProvenance;
  details?: boolean;
}) {
  const Icon = icons[provenance.kind];
  const indicator = (
    <span
      className={`data-source-indicator data-source-indicator--${provenance.kind}`}
    >
      <Icon aria-hidden="true" size={12} />
      {provenance.label}
    </span>
  );
  if (!details) return indicator;
  return (
    <details className="data-source-disclosure">
      <summary>{indicator}</summary>
      <div>
        <span>Data source</span>
        <strong>{provenance.source}</strong>
        <p>{provenance.detail}</p>
        <time>
          {provenance.updatedAt
            ? new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(provenance.updatedAt)
            : "No live update timestamp"}
        </time>
      </div>
    </details>
  );
}
