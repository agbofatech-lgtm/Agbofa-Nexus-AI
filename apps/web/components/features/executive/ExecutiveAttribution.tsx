import { ArrowRight } from "lucide-react";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { ExecutiveAttribution as Attribution } from "@/types/executive-command";

export function ExecutiveAttribution({ attribution }: { attribution: Attribution }) {
  return (
    <section className="executive-attribution" aria-labelledby="executive-attribution-title">
      <header>
        <div>
          <span>ATTRIBUTION</span>
          <h2 id="executive-attribution-title">Content → distribution → audience → conversion → revenue</h2>
        </div>
        <p>
          Causality {attribution.causality.replaceAll("_", " ")}. Missing stages stay unavailable. Revenue is never
          invented.
        </p>
      </header>
      <ol>
        {attribution.stages.map((stage, index) => (
          <li key={stage.stage}>
            <article>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{stage.stage}</strong>
              <b>{stage.value}</b>
              <p>{stage.evidence}</p>
              <small>{stage.caveat}</small>
              <ExecutionRealityBadge reality={stage.executionReality} />
            </article>
            {index < attribution.stages.length - 1 ? <ArrowRight aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>
      <footer>
        <DataSourceIndicator provenance={attribution.provenance} />
        <span>{attribution.classification}</span>
      </footer>
    </section>
  );
}
