"use client";

import { useMemo, useState } from "react";
import { ConfidenceBadge } from "@/components/shared/states";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type {
  BudgetSimulationPlan,
  ModelCandidate,
} from "@/types/phase5-experience";

export function BudgetSimulation({
  plans,
  candidates,
}: {
  plans: BudgetSimulationPlan[];
  candidates: ModelCandidate[];
}) {
  const [budget, setBudget] = useState(plans[1]?.budget ?? 90);
  const selected = useMemo(
    () => [...plans].sort((first, second) => Math.abs(first.budget - budget) - Math.abs(second.budget - budget))[0],
    [budget, plans],
  );
  if (!selected) return null;
  return (
    <section className="budget-simulation" aria-labelledby="budget-simulation-title"><header><div><span>BUDGET SIMULATION</span><h2 id="budget-simulation-title">Explore estimated model mix without spending</h2></div><ExecutionRealityBadge reality="SIMULATED" /></header><label>Simulated monthly planning budget: <strong>${budget}</strong><input aria-describedby="budget-boundary-note" max="160" min="30" onChange={(event) => setBudget(Number(event.target.value))} step="10" type="range" value={budget} /></label><p id="budget-boundary-note">Changing this control selects the nearest deterministic plan. It does not enforce a budget, reserve funds, or purchase AI usage.</p><article><header><div><span>{selected.label}</span><h3>${selected.estimatedCost} estimated of ${selected.budget} modeled budget</h3></div><ConfidenceBadge confidence={selected.confidence} /></header><div className="budget-simulation__metrics"><section><span>ESTIMATED TASKS</span><strong>{selected.estimatedTasks}</strong></section><section><span>EXPECTED IMPACT</span><strong>{selected.expectedImpactScore}/100</strong></section><section><span>RISK</span><strong>{selected.risk}</strong></section><section><span>REMAINING MODEL SPACE</span><strong>${selected.budget - selected.estimatedCost}</strong><small>Not real funds</small></section></div><section className="budget-model-mix"><span>ESTIMATED MODEL MIX</span>{selected.estimatedModelMix.map((mix) => <div key={mix.modelId}><strong>{candidates.find((candidate) => candidate.modelId === mix.modelId)?.modelName}</strong><i><b style={{ width: `${mix.percent}%` }} /></i><span>{mix.percent}%</span></div>)}</section></article></section>
  );
}
