"use client";

import { AlertTriangle, CircleDollarSign, Gauge } from "lucide-react";
import { useState } from "react";
import { ConfidenceBadge } from "@/components/shared/states";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { CostAwareStrategyOption } from "@/types/phase5-experience";
import type { StrategyDirectorPlan } from "@/types/strategy-director";

export function CostAwareStrategy({
  options,
  strategies,
}: {
  options: CostAwareStrategyOption[];
  strategies: StrategyDirectorPlan[];
}) {
  const [strategyId, setStrategyId] = useState(strategies[0]?.id ?? "");
  const visible = options.filter((option) => option.strategyId === strategyId);
  return (
    <section className="cost-aware-strategy" aria-labelledby="cost-aware-title"><header><div><span>COST-AWARE STRATEGY</span><h2 id="cost-aware-title">High quality vs balanced vs low cost</h2></div><label>Strategy<select onChange={(event) => setStrategyId(event.target.value)} value={strategyId}>{strategies.map((strategy) => <option key={strategy.id} value={strategy.id}>{strategy.title}</option>)}</select></label></header><p>No option is universally “best.” Each optimizes for a declared criterion and uses estimated—not actual—AI costs.</p><div>{visible.map((option) => <article key={option.id}><header><span>{option.mode.replaceAll("_", " ")}</span><ExecutionRealityBadge reality={option.executionReality} /></header><dl><div><dt>Estimated AI cost</dt><dd><CircleDollarSign aria-hidden="true" /> ${option.estimatedAICost}</dd></div><div><dt>Expected impact</dt><dd>{option.expectedImpactScore}/100</dd></div><div><dt>Quality</dt><dd><Gauge aria-hidden="true" /> {option.qualityScore}/100</dd></div><div><dt>Risk</dt><dd><AlertTriangle aria-hidden="true" /> {option.risk}</dd></div></dl><section><span>OPTIMIZES FOR</span><strong>{option.optimizationCriterion}</strong></section><ul>{option.tradeOffs.map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}</ul><ConfidenceBadge confidence={option.confidence} /></article>)}</div></section>
  );
}
