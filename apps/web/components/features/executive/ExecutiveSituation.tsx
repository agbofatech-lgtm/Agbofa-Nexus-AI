import { AlertTriangle, BrainCircuit, ShieldCheck } from "lucide-react";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import { ConfidenceBadge } from "@/components/shared/states";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { ExecutiveSituation as Situation } from "@/types/executive-command";

export function ExecutiveSituation({ situation }: { situation: Situation }) {
  const supporting = [
    situation.majorChange,
    situation.highestRisk,
    situation.decisionPressure,
    situation.strategyDirection,
    situation.learningSignal,
  ];
  return (
    <section className="executive-situation" aria-labelledby="executive-situation-title">
      <div className="executive-situation__lead">
        <span>EXECUTIVE SITUATION</span>
        <h2 id="executive-situation-title">{situation.operatingState.summary}</h2>
        <div>
          <ExecutionRealityBadge reality={situation.operatingState.executionReality} />
          <DataSourceIndicator provenance={situation.operatingState.provenance} />
          {situation.operatingState.confidence ? (
            <ConfidenceBadge compact confidence={situation.operatingState.confidence} />
          ) : null}
        </div>
      </div>
      <article className="executive-situation__priority">
        <header><span>MOST IMPORTANT OPPORTUNITY</span><BrainCircuit aria-hidden="true" /></header>
        <strong>{situation.topOpportunity.summary}</strong>
        <footer>
          <span>{situation.topOpportunity.sourceId}</span>
          {situation.topOpportunity.confidence ? <ConfidenceBadge compact confidence={situation.topOpportunity.confidence} /> : null}
        </footer>
      </article>
      <div className="executive-situation__signals">
        {supporting.map((item) => (
          <article key={item.id}>
            <header><span>{item.label}</span>{item.id.includes("risk") ? <AlertTriangle aria-hidden="true" size={13} /> : <ShieldCheck aria-hidden="true" size={13} />}</header>
            <p>{item.summary}</p>
            <footer><small>{item.sourceId}</small><ExecutionRealityBadge reality={item.executionReality} /></footer>
          </article>
        ))}
      </div>
    </section>
  );
}
