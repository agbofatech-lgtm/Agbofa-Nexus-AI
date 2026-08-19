import { ArrowRight, GitBranch, ShieldAlert } from "lucide-react";
import type { AttributionJourney } from "@/types/phase3-experience";

export function AttributionView({ journeys }: { journeys: AttributionJourney[] }) {
  return (
    <div className="phase3-stack">
      <section className="attribution-principle">
        <span>ATTRIBUTION CONTRACT</span>
        <h2>Trace the path. Preserve the unknown.</h2>
        <p>Stage-level evidence is not converted into unsupported causality. UNKNOWN remains a valid and necessary result.</p>
      </section>
      {journeys.map((journey) => (
        <article className="attribution-journey" key={journey.id}>
          <header><div><span>{journey.storyId}</span><h2>{journey.label}</h2></div><strong><ShieldAlert aria-hidden="true" size={13} /> Causality: not established</strong></header>
          <ol>
            {journey.stages.map((stage, index) => (
              <li key={stage.stage}>
                <header><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage.stage}</strong></header>
                <b className={`attribution-state attribution-state--${stage.state.toLowerCase()}`}>{stage.state}</b>
                <h3>{stage.value}</h3>
                <p>{stage.evidence}</p>
                <small>{stage.caveat}</small>
                {index < journey.stages.length - 1 ? <ArrowRight aria-hidden="true" className="attribution-journey__arrow" size={17} /> : null}
              </li>
            ))}
          </ol>
          <footer><GitBranch aria-hidden="true" size={15} /><p>Attribution state describes evidence authority at each step. It does not prove that content caused conversion or revenue.</p></footer>
        </article>
      ))}
    </div>
  );
}
