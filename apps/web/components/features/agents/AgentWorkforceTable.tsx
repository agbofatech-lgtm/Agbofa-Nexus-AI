"use client";

import { CircleDollarSign, GitBranch, Search, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { WorkforceStatusBadge } from "@/components/features/agents/WorkforceStatusBadge";
import { StrategyRiskBadge } from "@/components/features/strategy/StrategyRiskBadge";
import { ConfidenceBadge } from "@/components/shared/states";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { WorkforceAgentProjection } from "@/types/strategy-director";

export function AgentWorkforceTable({ workforce }: { workforce: WorkforceAgentProjection[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workforce.filter((item) =>
      (category === "ALL" || item.agent.category === category) &&
      (status === "ALL" || item.status === status) &&
      (!query || `${item.agent.id} ${item.agent.name} ${item.agent.description}`.toLowerCase().includes(query)),
    );
  }, [category, search, status, workforce]);
  return (
    <div className="workforce-directory">
      <section className="workforce-summary" aria-label="Simulated workforce summary">
        <article><span>Canonical agents</span><strong>{workforce.length}</strong><small>Registry identities</small></article>
        <article><span>Working projection</span><strong>{workforce.filter((item) => item.status === "WORKING").length}</strong><small>SIMULATED</small></article>
        <article><span>Awaiting approval</span><strong>{workforce.filter((item) => item.status === "WAITING_APPROVAL").length}</strong><small>Human review</small></article>
        <article><span>Blocked projection</span><strong>{workforce.filter((item) => item.status === "BLOCKED").length}</strong><small>No runtime action</small></article>
      </section>
      <section className="workforce-filters" aria-label="Agent workforce filters">
        <label><Search aria-hidden="true" size={13} /> Search<input onChange={(event) => setSearch(event.target.value)} placeholder="Agent ID, role, description…" value={search} /></label>
        <label>Role<select onChange={(event) => setCategory(event.target.value)} value={category}><option>ALL</option>{["content", "verification", "distribution", "analytics", "monetisation", "platform"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Status<select onChange={(event) => setStatus(event.target.value)} value={status}><option>ALL</option>{["IDLE", "WORKING", "BLOCKED", "WAITING_APPROVAL", "COMPLETED", "FAILED"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <span>{visible.length} shown</span>
      </section>
      <section className="workforce-list" aria-label="Canonical agent workforce projection">
        <header><span>IDENTITY / ROLE</span><span>SIMULATED ACTIVITY</span><span>STATE / PROGRESS</span><span>CONFIDENCE / COST</span><span>REVIEW / REALITY</span></header>
        {visible.map((item) => (
          <article key={item.agent.id}>
            <div className="workforce-list__identity"><span>{item.agent.id}</span><div><Link href={`/agents/${item.agent.id}`}>{item.agent.name}</Link><small>{item.agent.category} · canonical registry</small></div></div>
            <div className="workforce-list__task"><strong>{item.currentTask?.title ?? "No current Phase 4 assignment"}</strong><small>{item.currentTask?.objective ?? "Presentation projection is idle."}</small></div>
            <div className="workforce-list__progress"><WorkforceStatusBadge status={item.status} /><span><i><b style={{ width: `${item.progress}%` }} /></i>{item.progress}%</span></div>
            <div className="workforce-list__confidence"><ConfidenceBadge compact confidence={item.confidence} /><span><CircleDollarSign aria-hidden="true" size={11} /> ${item.estimatedCost.amount?.toLocaleString()} estimated</span></div>
            <div className="workforce-list__review"><span>{item.review.replaceAll("_", " ")}</span><ExecutionRealityBadge reality={item.executionReality} /></div>
            <details><summary>Dependencies, outputs, risk, provenance, and error</summary><div><section><span>DEPENDENCIES</span><p><GitBranch aria-hidden="true" size={12} /> {item.dependencyAgentIds.length ? item.dependencyAgentIds.join(" · ") : "No projected agent dependency"}</p></section><section><span>SIMULATED OUTPUTS</span><ul>{item.outputs.length ? item.outputs.map((output) => <li key={output}>{output}</li>) : <li>No simulated output</li>}</ul></section><section><span>TASK RISK</span>{item.currentTask ? <><StrategyRiskBadge risk={item.currentTask.risk} /><p>{item.currentTask.risk.rationale}</p></> : <p>No task risk projection</p>}</section><section><span>ERROR</span><p>{item.error ?? "No simulated error"}</p></section><section><span>PROVENANCE</span><p>{item.provenance.source} · {item.provenance.detail}</p></section></div></details>
          </article>
        ))}
        {!visible.length ? <aside><ShieldAlert aria-hidden="true" /><div><strong>No workforce records match</strong><p>Broaden the role, status, or search filters.</p></div></aside> : null}
      </section>
    </div>
  );
}
