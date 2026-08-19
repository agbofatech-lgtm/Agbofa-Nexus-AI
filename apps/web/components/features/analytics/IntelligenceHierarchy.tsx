import { ArrowRight, CheckCircle2, Lightbulb, Search, Target } from "lucide-react";
import { TruthStateBadge } from "@/components/features/phase3/TruthStateBadge";
import { ConfidenceBadge } from "@/components/shared/states";
import type { AnalyticsMetric } from "@/types/phase3-experience";

export function IntelligenceHierarchy({ metric }: { metric: AnalyticsMetric }) {
  const layers = [
    ["WHAT HAPPENED", metric.whatHappened, Search],
    ["WHAT CHANGED", metric.whatChanged, ArrowRight],
    ["WHY", metric.why, Lightbulb],
  ] as const;
  return (
    <article className="intelligence-hierarchy">
      <header>
        <div><span>DECISION NARRATIVE</span><h2>{metric.label}</h2></div>
        <div><TruthStateBadge state={metric.truth} /><ConfidenceBadge compact confidence={metric.confidence} /></div>
      </header>
      <div className="intelligence-hierarchy__metric">
        <strong>{metric.displayValue}</strong><span>{metric.unit}</span>
      </div>
      <ol className="intelligence-hierarchy__layers">
        {layers.map(([label, value, Icon], index) => (
          <li key={label}><span>{index + 1}</span><Icon aria-hidden="true" size={16} /><div><strong>{label}</strong><p>{value}</p></div></li>
        ))}
        <li className="intelligence-hierarchy__evidence"><span>4</span><CheckCircle2 aria-hidden="true" size={16} /><div><strong>EVIDENCE</strong><ul>{metric.evidence.map((item) => <li key={item}>{item}</li>)}</ul></div></li>
        <li><span>5</span><Target aria-hidden="true" size={16} /><div><strong>CONFIDENCE</strong><p>{metric.confidence.score}% {metric.confidence.kind} confidence · {metric.confidence.basis}</p></div></li>
      </ol>
      <footer>
        <div><span>MEANING</span><p>{metric.meaning}</p></div>
        <div><span>NEXT ACTION</span><p>{metric.nextAction}</p></div>
      </footer>
    </article>
  );
}
