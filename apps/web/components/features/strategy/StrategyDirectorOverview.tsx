"use client";

import { ArrowRight, BrainCircuit, CircleDollarSign, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { HumanOverrideConsole } from "@/components/features/strategy/HumanOverrideConsole";
import { StrategyCostRiskMatrix } from "@/components/features/strategy/StrategyCostRiskMatrix";
import { StrategyRiskBadge } from "@/components/features/strategy/StrategyRiskBadge";
import { StrategyTree } from "@/components/features/strategy/StrategyTree";
import { ConfidenceBadge } from "@/components/shared/states";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { StrategyDirectorData } from "@/types/strategy-director";

export function StrategyDirectorOverview({ data }: { data: StrategyDirectorData }) {
  const [selectedId, setSelectedId] = useState(data.plans[0]?.id ?? "");
  const selected = data.plans.find((plan) => plan.id === selectedId) ?? data.plans[0];
  if (!selected) return null;
  const recommendation = data.decisions.find(
    (decision) => decision.strategyId === selected.id,
  );
  return (
    <div className="strategy-stack">
      <section className="strategy-director-brief">
        <div className="strategy-director-brief__objective">
          <span>CURRENT OBJECTIVE</span>
          <h2>{data.currentObjective}</h2>
          <p>{data.currentSituation}</p>
        </div>
        <aside>
          <span>HUMAN-CONTROLLED OPERATING MODEL</span>
          <ol>
            <li><b>01</b><strong>Nexus recommends</strong></li>
            <li><b>02</b><strong>Human reviews</strong></li>
            <li><b>03</b><strong>Human decides</strong></li>
            <li><b>04</b><strong>System simulates</strong></li>
          </ol>
          <small><ShieldAlert aria-hidden="true" size={12} /> Real execution unavailable</small>
        </aside>
      </section>

      <section className="strategy-intelligence-strip" aria-labelledby="strategy-intelligence-title">
        <header><span>INTELLIGENCE</span><h2 id="strategy-intelligence-title">What the recommendation model sees</h2></header>
        <ol>{data.intelligence.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ol>
      </section>

      <section className="strategy-plan-selector" aria-label="Strategy plans">
        {data.plans.map((plan) => (
          <button aria-pressed={selected.id === plan.id} key={plan.id} onClick={() => setSelectedId(plan.id)} type="button">
            <span>{plan.status}</span>
            <strong>{plan.title}</strong>
            <small>{plan.progress}% simulated plan progress</small>
          </button>
        ))}
      </section>

      <article className="strategy-recommendation">
        <header>
          <div><span>NEXUS RECOMMENDS</span><h2>{selected.recommendation}</h2></div>
          <div><ExecutionRealityBadge reality={selected.executionReality} /><ConfidenceBadge confidence={selected.confidence} /></div>
        </header>
        <div className="strategy-recommendation__body">
          <section><span>WHY</span><p>{selected.intelligenceSummary}</p></section>
          <section><span>EXPECTED OUTCOMES</span><ul>{selected.expectedOutcomes.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section><span>ESTIMATED COST</span><strong><CircleDollarSign aria-hidden="true" size={16} /> ${selected.estimatedCost.amount?.toLocaleString()}</strong><small>{selected.estimatedCost.basis}</small></section>
          <section><span>RISK</span><StrategyRiskBadge risk={selected.risk} /><small>{selected.risk.rationale}</small></section>
        </div>
        {recommendation ? (
          <section className="strategy-evidence-panel">
            <header><span>EVIDENCE</span><strong>{recommendation.evidence.length} simulated sources</strong></header>
            <div>{recommendation.evidence.map((item) => <article key={item.id}><span>{item.source}</span><strong>{item.signal}</strong><p>{item.observation}</p><small><time dateTime={item.timestamp}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.timestamp))}</time> · SIMULATED</small><ConfidenceBadge compact confidence={item.confidence} /></article>)}</div>
          </section>
        ) : null}
        <footer><span>NEXT ACTION</span><p>{selected.nextAction}</p><Link href="/growth/decisions">Open Decision Center <ArrowRight aria-hidden="true" size={13} /></Link></footer>
      </article>

      <StrategyTree plan={selected} />
      <StrategyCostRiskMatrix plans={data.plans} />
      <section className="strategy-navigation-cards">
        <Link href="/growth/decisions"><BrainCircuit aria-hidden="true" /><div><span>DECISION CENTER</span><strong>{data.decisions.length} recommendations awaiting human review</strong></div><ArrowRight aria-hidden="true" /></Link>
        <Link href="/growth/strategy/timeline"><ArrowRight aria-hidden="true" /><div><span>30-DAY TIMELINE</span><strong>Inspect tasks, milestones, agents, and execution reality</strong></div><ArrowRight aria-hidden="true" /></Link>
      </section>
      <HumanOverrideConsole history={data.overrideHistory} plans={data.plans} workforce={data.workforce} />
    </div>
  );
}
