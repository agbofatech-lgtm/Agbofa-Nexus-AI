import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  ClipboardCheck,
  Clock3,
  type LucideIcon,
} from "lucide-react";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import type { DataProvenance } from "@/types/data-state";
import type { OperationTone, OperationalMetric } from "@/types/operations";
const icons: Record<OperationTone, LucideIcon> = {
  blue: BrainCircuit,
  gold: ClipboardCheck,
  green: Activity,
  purple: Activity,
  warning: Clock3,
  error: AlertTriangle,
};
export function OperationsSummary({
  title,
  eyebrow = "Operations",
  metrics,
  provenance,
}: {
  title: string;
  eyebrow?: string;
  metrics: readonly OperationalMetric[];
  provenance?: DataProvenance;
}) {
  const id = `${title.replaceAll(" ", "-").toLowerCase()}-title`;
  return (
    <section className="operations-summary" aria-labelledby={id}>
      <header className="operations-summary__header">
        <div>
          <span>{eyebrow}</span>
          <h2 id={id}>{title}</h2>
        </div>
        {provenance ? <DataSourceIndicator provenance={provenance} /> : null}
      </header>
      <div className="operations-summary__grid">
        {metrics.map((m) => {
          const Icon = icons[m.tone];
          return (
            <article
              key={m.id}
              className={`operations-summary__metric operations-summary__metric--${m.tone}`}
            >
              <span aria-hidden="true">
                <Icon size={16} />
              </span>
              <div>
                <strong>{m.value}</strong>
                <p>{m.label}</p>
                <small>{m.detail}</small>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
