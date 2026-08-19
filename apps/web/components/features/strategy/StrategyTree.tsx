import { ArrowDown, Boxes, CheckCircle2, CircleDollarSign, GitBranch, UserRound } from "lucide-react";
import Link from "next/link";
import { StrategyRiskBadge } from "@/components/features/strategy/StrategyRiskBadge";
import { ConfidenceBadge } from "@/components/shared/states";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { StrategyDirectorPlan } from "@/types/strategy-director";

export function StrategyTree({ plan }: { plan: StrategyDirectorPlan }) {
  return (
    <section className="strategy-tree" aria-labelledby="strategy-tree-title">
      <header><div><span>STRATEGY RELATIONSHIP MAP</span><h2 id="strategy-tree-title">Strategy → initiatives → tasks → agents → review</h2></div><p>Agent links preserve many-to-many relationships; the interface does not distort them into a false execution chain.</p></header>
      <div className="strategy-tree__root">
        <Boxes aria-hidden="true" size={18} />
        <div><span>{plan.id}</span><strong>{plan.title}</strong><small>{plan.strategy}</small></div>
        <ExecutionRealityBadge reality={plan.executionReality} />
      </div>
      <ArrowDown aria-hidden="true" className="strategy-tree__connector" />
      <div className="strategy-tree__initiatives">
        {plan.initiatives.map((initiative) => (
          <article key={initiative.id}>
            <header>
              <div><span>{initiative.id}</span><h3>{initiative.title}</h3></div>
              <ExecutionRealityBadge reality={initiative.executionReality} />
            </header>
            <p>{initiative.description}</p>
            <div className="strategy-tree__meta"><span>{initiative.progress}% progress</span><ConfidenceBadge compact confidence={initiative.confidence} /><StrategyRiskBadge risk={initiative.risk} /><span><CircleDollarSign aria-hidden="true" size={11} /> ${initiative.estimatedCost.amount?.toLocaleString()} estimated</span></div>
            <ol>
              {initiative.tasks.map((task) => (
                <li key={task.id}>
                  <details>
                    <summary>
                      <span>{task.status}</span>
                      <strong>{task.title}</strong>
                      <small>{task.progress}% · Day {task.startDay}–{task.startDay + task.durationDays - 1}</small>
                    </summary>
                    <div className="strategy-task-detail">
                      <section><span>OBJECTIVE</span><p>{task.objective}</p></section>
                      <section><span>RESPONSIBLE AGENTS</span><div>{task.agentIds.map((id) => <Link href={`/agents/${id}`} key={id}><UserRound aria-hidden="true" size={11} />{id}</Link>)}</div></section>
                      <section><span>DEPENDENCIES</span><p><GitBranch aria-hidden="true" size={12} /> {task.dependencyTaskIds.length ? task.dependencyTaskIds.join(" · ") : "No prerequisite task"}</p></section>
                      <section><span>SIMULATED OUTPUTS</span><ul>{task.outputs.map((output) => <li key={output}>{output}</li>)}</ul></section>
                      <section><span>REVIEW</span><p><CheckCircle2 aria-hidden="true" size={12} /> {task.review.replaceAll("_", " ")}</p></section>
                      <section><span>COST & RISK</span><p>${task.estimatedCost.amount?.toLocaleString()} estimated</p><StrategyRiskBadge risk={task.risk} /></section>
                      <ExecutionRealityBadge reality={task.executionReality} />
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
