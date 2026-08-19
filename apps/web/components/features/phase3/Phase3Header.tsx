import { CircleOff, Sparkles } from "lucide-react";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import type { DataProvenance } from "@/types/data-state";

export function Phase3Header({
  eyebrow,
  title,
  subtitle,
  provenance,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  provenance?: DataProvenance;
}) {
  return (
    <header className="phase3-header">
      <div>
        <span>
          <Sparkles aria-hidden="true" size={13} /> {eyebrow}
        </span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <aside aria-label="Experience execution boundary">
        <strong>Experience + simulation</strong>
        <span>
          <CircleOff aria-hidden="true" size={12} /> No external execution
        </span>
        {provenance ? (
          <DataSourceIndicator details provenance={provenance} />
        ) : null}
      </aside>
    </header>
  );
}
