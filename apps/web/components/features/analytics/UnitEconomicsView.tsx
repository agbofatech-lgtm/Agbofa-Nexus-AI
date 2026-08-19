import { Calculator, DatabaseZap } from "lucide-react";
import { TruthStateBadge } from "@/components/features/phase3/TruthStateBadge";
import type { UnitEconomicsMetric } from "@/types/phase3-experience";

export function UnitEconomicsView({ metrics }: { metrics: UnitEconomicsMetric[] }) {
  return (
    <div className="phase3-stack">
      <section className="economics-boundary">
        <div><span>FINANCIAL PROVENANCE</span><h2>Unavailable is more truthful than synthetic currency.</h2><p>Every financial metric stays empty until recognized revenue, verified spend, governed users, and defensible attribution are present.</p></div>
        <div><Calculator aria-hidden="true" /><strong>0 / {metrics.length}</strong><span>calculable</span></div>
      </section>
      <section className="economics-list" aria-label="Unit economics metrics">
        {metrics.map((item) => (
          <article key={item.metric}>
            <header><strong>{item.metric}</strong><TruthStateBadge state="UNAVAILABLE" /></header>
            <h2>{item.displayValue}</h2>
            <p>{item.definition}</p>
            <div><span>REQUIRED INPUTS</span><ul>{item.requiredInputs.map((input) => <li key={input}>{input}</li>)}</ul></div>
            <footer><DatabaseZap aria-hidden="true" size={13} /><span>{item.provenance.source}</span></footer>
          </article>
        ))}
      </section>
      <aside className="phase3-notice"><DatabaseZap aria-hidden="true" size={18} /><div><strong>No actual revenue, spend, ROI, or conversion data</strong><p>This is an explicit source boundary, not an error and not a zero-value business result.</p></div></aside>
    </div>
  );
}
