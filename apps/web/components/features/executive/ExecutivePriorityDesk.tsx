import { ArrowRight, Target } from "lucide-react";
import Link from "next/link";
import { ConfidenceBadge } from "@/components/shared/states";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type {
  ExecutiveDecision,
  ExecutiveOpportunity,
  ExecutiveStrategy,
} from "@/types/executive-command";

export function ExecutivePriorityDesk({
  opportunities,
  decisions,
  strategies,
}: {
  opportunities: ExecutiveOpportunity[];
  decisions: ExecutiveDecision[];
  strategies: ExecutiveStrategy[];
}) {
  return (
    <div className="executive-priority-desk">
      <section className="executive-opportunities" aria-labelledby="executive-opportunities-title">
        <header><div><span>PRIORITY SIGNALS</span><h2 id="executive-opportunities-title">Highest-priority opportunities</h2></div><Link href="/growth/opportunities">Opportunity Center <ArrowRight aria-hidden="true" size={12} /></Link></header>
        <ol>{opportunities.map((item, index) => <li key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><small>{item.id} · {item.evidenceCount} evidence signals</small></div><b><Target aria-hidden="true" size={11} /> {item.priority}/100</b><p>{item.expectedImpact} expected impact</p><ConfidenceBadge compact confidence={item.confidence} /><Link aria-label={`Open ${item.title}`} href={item.href}><ArrowRight aria-hidden="true" /></Link></li>)}</ol>
      </section>
      <section className="executive-decisions" aria-labelledby="executive-decisions-title">
        <header><div><span>DECISIONS REQUIRED</span><h2 id="executive-decisions-title">Owner review queue</h2></div><Link href="/growth/decisions">Decision Center <ArrowRight aria-hidden="true" size={12} /></Link></header>
        <div>{decisions.map((item) => <article key={item.id}><header><span>{item.priority} · {item.approvalState}</span><ExecutionRealityBadge reality={item.executionReality} /></header><strong>{item.recommendation}</strong><dl><div><dt>Risk</dt><dd>{item.risk}</dd></div><div><dt>Expected impact</dt><dd>{item.expectedImpact}</dd></div></dl><ConfidenceBadge compact confidence={item.confidence} /></article>)}</div>
      </section>
      <section className="executive-strategies" aria-labelledby="executive-strategies-title">
        <header><div><span>STRATEGIC DIRECTION</span><h2 id="executive-strategies-title">Plans and next actions</h2></div><Link href="/growth/strategy">Strategy Director <ArrowRight aria-hidden="true" size={12} /></Link></header>
        <div>{strategies.map((item) => <article key={item.id}><header><strong>{item.title}</strong><span>{item.risk} risk</span></header><p>{item.priorityInitiative}</p><div className="executive-strategy-progress"><i><b style={{ width: `${item.progress}%` }} /></i><span>{item.progress}%</span></div><footer><small>{item.pendingDecisions} pending decisions</small><ConfidenceBadge compact confidence={item.confidence} /><ExecutionRealityBadge reality={item.executionReality} /></footer><aside><span>NEXT ACTION</span><p>{item.nextAction}</p></aside></article>)}</div>
      </section>
    </div>
  );
}
