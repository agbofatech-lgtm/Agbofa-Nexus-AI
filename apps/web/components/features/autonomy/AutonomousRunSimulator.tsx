"use client";

import { CheckCircle2, CircleDollarSign, Pause, ShieldAlert, Square } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StrategyRiskBadge } from "@/components/features/strategy/StrategyRiskBadge";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { Phase5ExperienceData, RunState } from "@/types/phase5-experience";
import type { StrategyDirectorData } from "@/types/strategy-director";

const stages = ["PLAN", "PREPARE", "APPROVAL", "SIMULATED_EXECUTION", "REVIEW", "SIMULATED_RESULT"] as const;

export function AutonomousRunSimulator({
  data,
  strategy,
}: {
  data: Phase5ExperienceData;
  strategy: StrategyDirectorData;
}) {
  const [selectedId, setSelectedId] = useState(data.runs[0]?.id ?? "");
  const [localStates, setLocalStates] = useState<Record<string, RunState>>({});
  const [message, setMessage] = useState("No simulated intervention applied in this session.");
  const selected = data.runs.find((run) => run.id === selectedId) ?? data.runs[0];
  if (!selected) return null;
  const state = localStates[selected.id] ?? selected.state;
  const transition = (next: RunState, label: string) => {
    setLocalStates((current) => ({ ...current, [selected.id]: next }));
    setMessage(`${label}: ${selected.id} moved to ${next} locally. No task, agent, provider, publishing, spending, or backend job was affected.`);
  };
  const plan = strategy.plans.find((item) => item.id === selected.strategyId);
  const initiative = plan?.initiatives.find((item) => item.id === selected.initiativeId);
  return (
    <div className="phase5-stack">
      <section className="run-register" aria-label="Simulated autonomous runs">
        {data.runs.map((run) => <button aria-pressed={selected.id === run.id} key={run.id} onClick={() => setSelectedId(run.id)} type="button"><span>{localStates[run.id] ?? run.state}</span><strong>{run.objective}</strong><small>{run.id} · {run.progress}% fixture progress</small></button>)}
      </section>
      <article className="run-simulator">
        <header><div><span>{selected.id} · {state}</span><h2>{selected.objective}</h2></div><ExecutionRealityBadge reality={selected.executionReality} /></header>
        <div className="run-simulator__context"><section><span>STRATEGY</span><strong>{plan?.title}</strong><small>{selected.strategyId}</small></section><section><span>INITIATIVE</span><strong>{initiative?.title}</strong><small>{selected.initiativeId}</small></section><section><span>ESTIMATED BUDGET / COST</span><strong><CircleDollarSign aria-hidden="true" size={14} /> ${selected.estimatedBudget.amount?.toLocaleString()} / ${selected.estimatedCost.toLocaleString()}</strong><small>Not actual spend</small></section><section><span>RISK</span><StrategyRiskBadge risk={selected.risk} /></section></div>
        <section className="run-stage-map" aria-label="Simulated run stages"><ol>{stages.map((stage, index) => { const active = stage === selected.currentStage; const complete = stages.indexOf(selected.currentStage) > index; return <li className={active ? "run-stage run-stage--active" : complete ? "run-stage run-stage--complete" : "run-stage"} key={stage}><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage.replaceAll("_", " ")}</strong><small>{active ? "Current fixture stage" : complete ? "Simulated prior state" : "Planned"}</small></li>; })}</ol></section>
        <div className="run-detail-grid"><section><span>SIMULATED TASKS</span><ul>{selected.taskIds.map((id) => <li key={id}>{id}<small>{initiative?.tasks.find((task) => task.id === id)?.title}</small></li>)}</ul></section><section><span>CANONICAL AGENTS</span><div>{selected.agentIds.map((id) => <Link href={`/agents/${id}`} key={id}>{id}<small>{strategy.workforce.find((item) => item.agent.id === id)?.agent.name}</small></Link>)}</div></section><section><span>APPROVAL GATES</span><ul>{selected.approvalGates.map((gate) => <li key={gate.id}><strong>{gate.label}</strong><b>{gate.state.replaceAll("_", " ")}</b><small>{gate.reason}</small></li>)}</ul></section><section><span>INTERVENTION POINTS</span><ul>{selected.interventionPoints.map((item) => <li key={item}>{item}</li>)}</ul></section></div>
        <section className="run-outcome"><span>OUTCOME</span><p>{selected.outcome}</p><div><i><b style={{ width: `${selected.progress}%` }} /></i><strong>{selected.progress}% deterministic fixture progress</strong></div></section>
        <div className="run-actions"><button onClick={() => transition("PAUSED", "Simulate pause")} type="button"><Pause aria-hidden="true" size={12} /> Simulate pause</button><button onClick={() => transition("STOPPED", "Simulate stop")} type="button"><Square aria-hidden="true" size={12} /> Simulate stop</button><button onClick={() => transition("WAITING_APPROVAL", "Require approval")} type="button"><CheckCircle2 aria-hidden="true" size={12} /> Require simulated approval</button></div>
        <p aria-live="polite" className="run-message"><ShieldAlert aria-hidden="true" size={13} /> {message}</p>
      </article>
    </div>
  );
}
