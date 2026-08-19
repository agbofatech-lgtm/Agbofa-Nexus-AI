"use client";

import { AlertTriangle, Archive, BrainCircuit, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfidenceBadge } from "@/components/shared/states";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type {
  MemoryConflict,
  MemoryRecord,
  MemoryTrustState,
} from "@/types/phase5-experience";

const loop = ["DECISION", "ACTION", "RESULT", "LEARNING", "MEMORY", "NEXT STRATEGY"] as const;

export function MemoryWorkspace({
  memories,
  conflicts,
}: {
  memories: MemoryRecord[];
  conflicts: MemoryConflict[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [state, setState] = useState("ALL");
  const [selectedId, setSelectedId] = useState(memories[0]?.id ?? "");
  const [localStates, setLocalStates] = useState<Record<string, MemoryTrustState>>({});
  const [message, setMessage] = useState("No local memory review transition applied.");
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return memories.filter((memory) => {
      const current = localStates[memory.id] ?? memory.trustState;
      return (category === "ALL" || memory.category === category) && (state === "ALL" || current === state) && (!query || `${memory.id} ${memory.insight} ${memory.source}`.toLowerCase().includes(query));
    });
  }, [category, localStates, memories, search, state]);
  const selected = visible.find((memory) => memory.id === selectedId) ?? visible[0] ?? memories[0];
  if (!selected) return null;
  const selectedState = localStates[selected.id] ?? selected.trustState;
  const transition = (next: MemoryTrustState, label: string) => {
    setLocalStates((current) => ({ ...current, [selected.id]: next }));
    setMessage(`${label}: ${selected.id} now displays ${next} locally. No persistent memory was written, invalidated, synchronized, or deleted.`);
  };
  return (
    <div className="phase5-stack">
      <section className="memory-loop" aria-labelledby="memory-loop-title"><header><div><span>LEARNING LOOP</span><h2 id="memory-loop-title">Decision → action → result → learning → memory → next strategy</h2></div><ExecutionRealityBadge reality="SIMULATED" /></header><ol>{loop.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><BrainCircuit aria-hidden="true" size={14} /><strong>{item}</strong></li>)}</ol></section>
      <section className="memory-filters" aria-label="Memory filters"><label><Search aria-hidden="true" size={12} /> Search<input onChange={(event) => setSearch(event.target.value)} placeholder="Insight, source, memory ID…" value={search} /></label><label>Category<select onChange={(event) => setCategory(event.target.value)} value={category}><option>ALL</option>{[...new Set(memories.map((memory) => memory.category))].map((item) => <option key={item}>{item}</option>)}</select></label><label>Trust state<select onChange={(event) => setState(event.target.value)} value={state}><option>ALL</option>{["NEW", "ACTIVE", "NEEDS_REVIEW", "STALE", "CONTRADICTED", "ARCHIVED", "SIMULATED"].map((item) => <option key={item}>{item}</option>)}</select></label><span>{visible.length} records</span></section>
      <div className="memory-layout">
        <section className="memory-register" aria-label="Simulated memory records"><header><span>MEMORY REGISTER</span><strong>Frontend fixture only</strong></header><div>{visible.map((memory) => { const current = localStates[memory.id] ?? memory.trustState; return <button aria-pressed={selected.id === memory.id} key={memory.id} onClick={() => setSelectedId(memory.id)} type="button"><span>{memory.category.replaceAll("_", " ")}</span><strong>{memory.insight}</strong><small>{memory.id} · {current.replaceAll("_", " ")}</small><ConfidenceBadge compact confidence={memory.confidence} /></button>; })}</div>{!visible.length ? <aside><Search aria-hidden="true" /><p>No memories match the current filters.</p></aside> : null}</section>
        <article className="memory-detail"><header><div><span>{selected.id} · {selected.category.replaceAll("_", " ")}</span><h2>{selected.insight}</h2></div><div><b className={`memory-state memory-state--${selectedState.toLowerCase()}`}>{selectedState.replaceAll("_", " ")}</b><ExecutionRealityBadge reality={selected.executionReality} /></div></header><section className="memory-trust-grid"><div><span>CONFIDENCE</span><ConfidenceBadge confidence={selected.confidence} /></div><div><span>SAMPLE SIZE</span><strong>{selected.sampleSize === null ? "Not applicable" : selected.sampleSize.toLocaleString()}</strong></div><div><span>OBSERVATION WINDOW</span><strong>{selected.observationPeriod}</strong></div><div><span>APPLICABILITY</span><strong>{selected.applicability.join(" · ")}</strong></div><div><span>LAST OBSERVED</span><time dateTime={selected.lastObserved}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.lastObserved))}</time></div><div><span>REVIEW / FRESHNESS</span><strong>{selected.reviewStatus.replaceAll("_", " ")} · {selected.freshness.replaceAll("_", " ")}</strong></div></section><section className="memory-evidence"><span>WHY DOES NEXUS REMEMBER THIS?</span><div>{selected.evidence.map((evidence) => <article key={evidence.id}><header><strong>{evidence.sourceType} · {evidence.sourceId}</strong><ConfidenceBadge compact confidence={evidence.confidence} /></header><p>{evidence.observation}</p><small><time dateTime={evidence.observedAt}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(evidence.observedAt))}</time> · SIMULATED</small></article>)}</div></section><section><span>EXPIRATION / REVIEW</span><p>{selected.expirationReview}</p><small>{selected.provenance.detail}</small></section><div className="memory-actions"><button onClick={() => transition("ACTIVE", "Simulate review")} type="button"><CheckCircle2 aria-hidden="true" size={12} /> Mark simulated reviewed</button><button onClick={() => transition("NEEDS_REVIEW", "Request review")} type="button"><ShieldCheck aria-hidden="true" size={12} /> Request simulated review</button><button onClick={() => transition("ARCHIVED", "Archive simulation")} type="button"><Archive aria-hidden="true" size={12} /> Archive locally</button></div><p className="memory-message" aria-live="polite">{message}</p></article>
      </div>
      <section className="memory-conflicts" aria-labelledby="memory-conflicts-title"><header><div><span>MEMORY CONFLICTS</span><h2 id="memory-conflicts-title">Do not silently merge contradictory learning</h2></div><AlertTriangle aria-hidden="true" /></header>{conflicts.map((conflict) => { const first = memories.find((memory) => memory.id === conflict.memoryIds[0]); const second = memories.find((memory) => memory.id === conflict.memoryIds[1]); return <article key={conflict.id}><div><span>MEMORY A</span><strong>{first?.insight}</strong><small>{conflict.observationPeriods[0]} · {first?.confidence.score}% confidence</small></div><b>CONFLICT</b><div><span>MEMORY B</span><strong>{second?.insight}</strong><small>{conflict.observationPeriods[1]} · {second?.confidence.score}% confidence</small></div><footer><p>{conflict.evidenceComparison}</p><strong>{conflict.resolutionStatus.replaceAll("_", " ")}</strong></footer></article>; })}</section>
    </div>
  );
}
