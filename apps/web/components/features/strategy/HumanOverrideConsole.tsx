"use client";

import { Hand, Pause, ShieldAlert, Square, Workflow } from "lucide-react";
import { useMemo, useState } from "react";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type {
  OverrideHistoryRecord,
  StrategyDirectorPlan,
  WorkforceAgentProjection,
} from "@/types/strategy-director";

export function HumanOverrideConsole({
  history,
  plans,
  workforce,
}: {
  history: OverrideHistoryRecord[];
  plans: StrategyDirectorPlan[];
  workforce: WorkforceAgentProjection[];
}) {
  const targets = useMemo(
    () => [
      ...plans.map((plan) => ({ id: plan.id, label: `Strategy · ${plan.title}` })),
      ...workforce.slice(0, 5).map((item) => ({ id: item.agent.id, label: `Agent projection · ${item.agent.name}` })),
    ],
    [plans, workforce],
  );
  const [target, setTarget] = useState(targets[0]?.id ?? "");
  const [message, setMessage] = useState("No simulated override requested in this view.");
  const apply = (action: "PAUSE" | "STOP" | "OVERRIDE") =>
    setMessage(`${action}_REQUESTED for ${target} in local UI state. No agent, job, strategy, permission, provider, or external system was affected.`);
  return (
    <section className="override-console" aria-labelledby="override-console-title">
      <header><div><span>HUMAN OVERRIDE SIMULATION</span><h2 id="override-console-title">Visible control without hidden execution</h2></div><ExecutionRealityBadge reality="SIMULATED" /></header>
      <aside><ShieldAlert aria-hidden="true" /><p>Pause, stop, and override controls demonstrate frontend state transitions only. They cannot interrupt a runtime or revoke authority.</p></aside>
      <div className="override-console__controls">
        <label>Simulation target<select onChange={(event) => setTarget(event.target.value)} value={target}>{targets.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <div><button onClick={() => apply("PAUSE")} type="button"><Pause aria-hidden="true" size={13} /> Simulate pause</button><button onClick={() => apply("STOP")} type="button"><Square aria-hidden="true" size={13} /> Simulate stop</button><button onClick={() => apply("OVERRIDE")} type="button"><Hand aria-hidden="true" size={13} /> Simulate override</button></div>
      </div>
      <p className="override-console__message" aria-live="polite"><Workflow aria-hidden="true" size={14} /> {message}</p>
      <details><summary>View simulated override history ({history.length})</summary><div className="responsive-table"><table><thead><tr><th>Action</th><th>Target</th><th>Time</th><th>Previous</th><th>Result</th><th>Reason</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td>{item.action}<small>SIMULATED</small></td><th scope="row">{item.targetType} · {item.targetId}</th><td><time dateTime={item.timestamp}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.timestamp))}</time></td><td>{item.previousState}</td><td>{item.resultingState.replaceAll("_", " ")}</td><td>{item.reason}</td></tr>)}</tbody></table></div></details>
    </section>
  );
}
