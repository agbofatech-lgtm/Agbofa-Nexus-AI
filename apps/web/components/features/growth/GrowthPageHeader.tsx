import { BrainCircuit } from "lucide-react";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import type { DataProvenance } from "@/types/data-state";
export function GrowthPageHeader({
  title,
  subtitle,
  eyebrow,
  provenance,
}: {
  title: string;
  subtitle: string;
  eyebrow: string;
  provenance?: DataProvenance;
}) {
  return (
    <header className="growth-os-header">
      <div>
        <span>
          <BrainCircuit size={14} />
          {eyebrow}
        </span>
        <h1>
          {title}
          <b>.</b>
        </h1>
        <p>{subtitle}</p>
      </div>
      {provenance ? (
        <DataSourceIndicator details provenance={provenance} />
      ) : null}
    </header>
  );
}
