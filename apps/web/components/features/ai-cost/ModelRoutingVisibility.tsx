"use client";

import { ArrowRight, Box, CircleDollarSign, Route } from "lucide-react";
import { useState } from "react";
import { ConfidenceBadge } from "@/components/shared/states";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type {
  ModelCandidate,
  ModelRoutingSimulation,
} from "@/types/phase5-experience";

const chain = ["TASK", "COMPLEXITY", "MODEL CANDIDATE", "ESTIMATED QUALITY", "ESTIMATED COST", "TRADE-OFF", "SELECTED SIMULATION"] as const;

export function ModelRoutingVisibility({
  candidates,
  routes,
}: {
  candidates: ModelCandidate[];
  routes: ModelRoutingSimulation[];
}) {
  const [selectedId, setSelectedId] = useState(routes[0]?.id ?? "");
  const selected = routes.find((item) => item.id === selectedId) ?? routes[0];
  if (!selected) return null;
  return (
    <section className="model-routing" aria-labelledby="model-routing-title">
      <header><div><span>MODEL ROUTING VISIBILITY</span><h2 id="model-routing-title">Conceptual selection chain — no provider routing</h2></div><ExecutionRealityBadge reality="SIMULATED" /></header>
      <ol className="routing-chain">{chain.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong>{index < chain.length - 1 ? <ArrowRight aria-hidden="true" size={12} /> : null}</li>)}</ol>
      <div className="model-routing__layout"><nav aria-label="Routing simulations">{routes.map((route) => <button aria-pressed={route.id === selected.id} key={route.id} onClick={() => setSelectedId(route.id)} type="button"><span>{route.complexity} COMPLEXITY</span><strong>{route.taskLabel}</strong><small>{route.taskId} · ${route.estimatedCost.toFixed(4)} estimated</small></button>)}</nav><article><header><div><span>{selected.id} · {selected.complexity}</span><h3>{selected.taskLabel}</h3></div><ConfidenceBadge confidence={selected.confidence} /></header><div className="routing-candidates">{selected.candidateModelIds.map((id) => { const model = candidates.find((candidate) => candidate.modelId === id); const chosen = id === selected.selectedModelId; return <section className={chosen ? "routing-candidate routing-candidate--selected" : "routing-candidate"} key={id}><Box aria-hidden="true" /><strong>{model?.modelName}</strong><span>{model?.providerId} · catalog only</span><dl><div><dt>Quality</dt><dd>{model?.estimatedQuality}/100</dd></div><div><dt>Latency</dt><dd>{model?.latencyClass}</dd></div><div><dt>Input rate</dt><dd>${model?.estimatedInputRatePerMillion}/M</dd></div><div><dt>Output rate</dt><dd>${model?.estimatedOutputRatePerMillion}/M</dd></div></dl>{chosen ? <b>SELECTED IN SIMULATION</b> : <small>Candidate</small>}</section>; })}</div><section className="routing-reason"><Route aria-hidden="true" /><div><span>REASON</span><p>{selected.reason}</p><small>{selected.tradeOff}</small></div><strong><CircleDollarSign aria-hidden="true" size={12} /> ${selected.estimatedCost.toFixed(4)} estimated</strong></section></article></div>
    </section>
  );
}
