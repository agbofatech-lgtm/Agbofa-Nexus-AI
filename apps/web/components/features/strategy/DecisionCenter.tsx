"use client";

import { Check, CircleDollarSign, Edit3, Eye, RotateCcw, ShieldX } from "lucide-react";
import { useMemo, useState } from "react";
import { StrategyRiskBadge } from "@/components/features/strategy/StrategyRiskBadge";
import { ConfidenceBadge } from "@/components/shared/states";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type {
  DecisionHistoryRecord,
  DecisionQueueStatus,
  StrategyDirectorDecision,
} from "@/types/strategy-director";

const all = "ALL" as const;
type ConfidenceFilter = "ALL" | "HIGH" | "MEDIUM" | "LOW";

export function DecisionCenter({
  decisions,
  history,
}: {
  decisions: StrategyDirectorDecision[];
  history: DecisionHistoryRecord[];
}) {
  const [priority, setPriority] = useState<string>(all);
  const [type, setType] = useState<string>(all);
  const [status, setStatus] = useState<string>(all);
  const [domain, setDomain] = useState<string>(all);
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>(all);
  const [risk, setRisk] = useState<string>(all);
  const [localStates, setLocalStates] = useState<Record<string, DecisionQueueStatus>>({});
  const [selectedId, setSelectedId] = useState(decisions[0]?.id ?? "");
  const [modification, setModification] = useState("");
  const [message, setMessage] = useState("No local decision transition has been applied.");
  const [localHistory, setLocalHistory] = useState<Array<{ id: string; decisionId: string; action: string; result: DecisionQueueStatus; note: string }>>([]);

  const visible = useMemo(
    () =>
      decisions.filter((decision) => {
        const currentStatus = localStates[decision.id] ?? decision.status;
        const confidenceMatches =
          confidenceFilter === "ALL" ||
          (confidenceFilter === "HIGH" && decision.confidence.score >= 80) ||
          (confidenceFilter === "MEDIUM" && decision.confidence.score >= 60 && decision.confidence.score < 80) ||
          (confidenceFilter === "LOW" && decision.confidence.score < 60);
        return (
          (priority === all || decision.priority === priority) &&
          (type === all || decision.type === type) &&
          (status === all || currentStatus === status) &&
          (domain === all || decision.domain === domain) &&
          (risk === all || decision.risk.level === risk) &&
          confidenceMatches
        );
      }),
    [confidenceFilter, decisions, domain, localStates, priority, risk, status, type],
  );
  const selected =
    visible.find((decision) => decision.id === selectedId) ??
    visible[0] ??
    decisions[0];
  if (!selected) return null;
  const currentStatus = localStates[selected.id] ?? selected.status;
  const transition = (action: "REVIEW" | "MODIFY" | "APPROVE" | "REJECT", result: DecisionQueueStatus) => {
    const note = action === "MODIFY" ? modification.trim() || "Simulated recommendation wording modified." : `Simulated ${action.toLowerCase()} transition only.`;
    setLocalStates((current) => ({ ...current, [selected.id]: result }));
    setLocalHistory((current) => [{ id: `local-${current.length + 1}`, decisionId: selected.id, action, result, note }, ...current]);
    setMessage(`${selected.id} moved to ${result} locally. No authorization, task dispatch, agent execution, provider action, or external mutation occurred.`);
    if (action === "MODIFY") setModification("");
  };
  const reset = () => {
    setPriority(all); setType(all); setStatus(all); setDomain(all); setConfidenceFilter(all); setRisk(all);
  };
  return (
    <div className="strategy-stack">
      <section className="decision-filters" aria-label="Decision queue filters">
        <label>Priority<select onChange={(event) => setPriority(event.target.value)} value={priority}><option>ALL</option>{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Type<select onChange={(event) => setType(event.target.value)} value={type}><option>ALL</option>{["STRATEGY", "INITIATIVE", "SEQUENCING", "REVIEW", "RESOURCE"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Status<select onChange={(event) => setStatus(event.target.value)} value={status}><option>ALL</option>{["PENDING", "REVIEW", "MODIFIED", "APPROVED", "REJECTED"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Domain<select onChange={(event) => setDomain(event.target.value)} value={domain}><option>ALL</option>{["CONTENT", "DISTRIBUTION", "GROWTH", "ANALYTICS", "EXPERIMENTATION", "WORKFORCE"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Confidence<select onChange={(event) => setConfidenceFilter(event.target.value as ConfidenceFilter)} value={confidenceFilter}><option>ALL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></label>
        <label>Risk<select onChange={(event) => setRisk(event.target.value)} value={risk}><option>ALL</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>
        <button onClick={reset} type="button"><RotateCcw aria-hidden="true" size={12} /> Reset</button>
      </section>
      <div className="decision-layout">
        <section className="decision-queue" aria-label="Pending simulated decisions">
          <header><div><span>PENDING QUEUE</span><h2>{visible.length} decisions</h2></div><ExecutionRealityBadge reality="SIMULATED" /></header>
          <div>{visible.map((decision) => {
            const state = localStates[decision.id] ?? decision.status;
            return <button aria-pressed={selected.id === decision.id} key={decision.id} onClick={() => setSelectedId(decision.id)} type="button"><span>{decision.priority} · {decision.domain}</span><strong>{decision.recommendation}</strong><small>{decision.id} · {state}</small><div><ConfidenceBadge compact confidence={decision.confidence} /><StrategyRiskBadge risk={decision.risk} /></div></button>;
          })}</div>
          {!visible.length ? <aside><strong>No decisions match</strong><p>Reset or broaden the filters.</p></aside> : null}
        </section>
        <article className="decision-detail">
          <header><div><span>{selected.id} · {selected.type}</span><h2>{selected.recommendation}</h2></div><b className={`decision-status decision-status--${currentStatus.toLowerCase()}`}>{currentStatus}</b></header>
          <section><span>WHY</span><p>{selected.reason}</p></section>
          <section className="decision-evidence"><span>EVIDENCE</span><div>{selected.evidence.map((item) => <article key={item.id}><strong>{item.signal}</strong><p>{item.observation}</p><small>{item.source} · <time dateTime={item.timestamp}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.timestamp))}</time> · SIMULATED</small><ConfidenceBadge compact confidence={item.confidence} /></article>)}</div></section>
          <div className="decision-impact-grid"><section><span>EXPECTED IMPACT</span><strong>{selected.expectedImpact.label}</strong><small>{selected.expectedImpact.range?.minimum}–{selected.expectedImpact.range?.maximum} modeled score</small></section><section><span>ESTIMATED COST</span><strong><CircleDollarSign aria-hidden="true" size={14} /> ${selected.estimatedCost.amount?.toLocaleString()}</strong><small>Not actual spend</small></section><section><span>RISK</span><StrategyRiskBadge risk={selected.risk} /><small>{selected.risk.rationale}</small></section><section><span>CONFIDENCE</span><ConfidenceBadge confidence={selected.confidence} /></section></div>
          <section><span>NEXT ACTION</span><p>{selected.nextAction}</p></section>
          <label className="decision-modification">Simulated modification note<textarea maxLength={400} onChange={(event) => setModification(event.target.value)} placeholder="Describe the requested simulated change…" value={modification} /></label>
          <div className="decision-actions"><button onClick={() => transition("REVIEW", "REVIEW")} type="button"><Eye aria-hidden="true" size={12} /> Review simulated decision</button><button onClick={() => transition("MODIFY", "MODIFIED")} type="button"><Edit3 aria-hidden="true" size={12} /> Save simulated modification</button><button onClick={() => transition("APPROVE", "APPROVED")} type="button"><Check aria-hidden="true" size={12} /> Approve simulated decision</button><button onClick={() => transition("REJECT", "REJECTED")} type="button"><ShieldX aria-hidden="true" size={12} /> Reject simulated decision</button></div>
          <p className="decision-message" aria-live="polite">{message}</p>
          <ExecutionRealityBadge reality={selected.executionReality} />
        </article>
      </div>
      <section className="decision-history" aria-labelledby="decision-history-title"><header><div><span>DECISION HISTORY</span><h2 id="decision-history-title">Simulated review record</h2></div><small>{history.length + localHistory.length} events</small></header><div className="responsive-table"><table><thead><tr><th>Decision</th><th>Action</th><th>Result</th><th>Actor / time</th><th>Note</th><th>Reality</th></tr></thead><tbody>{localHistory.map((item) => <tr key={item.id}><th scope="row">{item.decisionId}</th><td>{item.action}</td><td>{item.result}</td><td>Demo strategy reviewer · local session</td><td>{item.note}</td><td>SIMULATED</td></tr>)}{history.map((item) => <tr key={item.id}><th scope="row">{item.decisionId}</th><td>{item.action}</td><td>{item.previousStatus} → {item.resultingStatus}</td><td>{item.actor}<small><time dateTime={item.timestamp}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.timestamp))}</time></small></td><td>{item.note}</td><td>{item.executionReality}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}
