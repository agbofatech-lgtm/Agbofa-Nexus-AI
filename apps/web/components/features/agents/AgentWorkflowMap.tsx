"use client";

import { ArrowRight, GitBranch, ShieldCheck, Workflow } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { StrategyDirectorData } from "@/types/strategy-director";

export function AgentWorkflowMap({ data }: { data: StrategyDirectorData }) {
  const [selectedId, setSelectedId] = useState(data.workflow[0]?.id ?? "DISCOVER");
  const selected = data.workflow.find((stage) => stage.id === selectedId) ?? data.workflow[0];
  const tasks = data.plans.flatMap((plan) => plan.initiatives).flatMap((initiative) => initiative.tasks);
  const dependencies = tasks.flatMap((task) => task.dependencyTaskIds.map((dependencyId) => ({ before: tasks.find((item) => item.id === dependencyId), after: task }))).filter((item) => item.before);
  if (!selected) return null;
  return (
    <div className="agent-workflow-stack">
      <section className="agent-workflow-map" aria-labelledby="agent-workflow-title">
        <header><div><span>SIMULATED WORKFORCE FLOW</span><h2 id="agent-workflow-title">Discover → detect → verify → analyze → create → review → distribute → measure → optimize</h2></div><ExecutionRealityBadge reality="SIMULATED" /></header>
        <ol>{data.workflow.map((stage, index) => <li key={stage.id}><button aria-pressed={selected.id === stage.id} onClick={() => setSelectedId(stage.id)} type="button"><span>{String(stage.order).padStart(2, "0")}</span><Workflow aria-hidden="true" size={15} /><strong>{stage.title}</strong><small>{stage.agentIds.length} agents · {stage.progress}%</small><i><b style={{ width: `${stage.progress}%` }} /></i>{stage.reviewRequired ? <em><ShieldCheck aria-hidden="true" size={10} /> Human review</em> : <em>Analysis stage</em>}</button>{index < data.workflow.length - 1 ? <ArrowRight aria-hidden="true" /> : null}</li>)}</ol>
      </section>
      <article className="agent-workflow-detail">
        <header><div><span>{selected.id} · STAGE {selected.order}</span><h2>{selected.title}</h2></div><strong>{selected.progress}% simulated progress</strong></header>
        <div><section><span>PARTICIPATING AGENTS</span><div>{selected.agentIds.map((id) => <Link href={`/agents/${id}`} key={id}>{id}<small>{data.workforce.find((item) => item.agent.id === id)?.agent.name}</small></Link>)}</div></section><section><span>SIMULATED TASKS</span><ul>{selected.taskIds.map((id) => <li key={id}><strong>{id}</strong><p>{tasks.find((task) => task.id === id)?.title}</p></li>)}</ul></section><section><span>OUTPUTS</span><ul>{selected.outputs.map((item) => <li key={item}>{item}</li>)}</ul></section><section><span>DEPENDENCIES / REVIEW</span><p>{selected.dependencyStageIds.length ? `${selected.dependencyStageIds.join(" · ")} must precede this presentation stage.` : "No prior stage."}</p><p>{selected.reviewRequired ? "Human review is required before any downstream simulated state." : "No approval is represented at this analysis stage."}</p></section></div>
      </article>
      <section className="agent-dependency-graph" aria-labelledby="agent-dependency-graph-title">
        <header><div><span>DEPENDENCY GRAPH</span><h2 id="agent-dependency-graph-title">Prerequisite task → dependent task</h2></div><p>Many-to-many relationships are shown as edges, not forced into a tree.</p></header>
        <div>{dependencies.slice(0, 12).map(({ before, after }) => before ? <article key={`${before.id}-${after.id}`}><div><span>{before.id}</span><strong>{before.title}</strong><small>{before.agentIds.join(" · ")}</small></div><ArrowRight aria-label="must complete before" /><div><span>{after.id}</span><strong>{after.title}</strong><small>{after.agentIds.join(" · ")}</small></div><b><GitBranch aria-hidden="true" size={11} /> SIMULATED DEPENDENCY</b></article> : null)}</div>
      </section>
    </div>
  );
}
