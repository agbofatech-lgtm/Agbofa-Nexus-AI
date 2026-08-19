"use client";

import { CalendarDays, Flag, Search, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type {
  StrategyDirectorPlan,
  StrategyTimelineItem,
  TimelineView,
  WorkforceAgentProjection,
} from "@/types/strategy-director";

type Zoom = "COMPACT" | "COMFORTABLE" | "DETAIL";
const all = "ALL";

export function StrategyTimeline({
  plans,
  timeline,
  workforce,
}: {
  plans: StrategyDirectorPlan[];
  timeline: StrategyTimelineItem[];
  workforce: WorkforceAgentProjection[];
}) {
  const [view, setView] = useState<TimelineView>("DAY");
  const [zoom, setZoom] = useState<Zoom>("COMFORTABLE");
  const [strategy, setStrategy] = useState(all);
  const [initiative, setInitiative] = useState(all);
  const [agent, setAgent] = useState(all);
  const [milestone, setMilestone] = useState(all);
  const [selectedId, setSelectedId] = useState(timeline[0]?.id ?? "");
  const initiatives = plans.flatMap((plan) => plan.initiatives);
  const visible = useMemo(
    () =>
      timeline.filter(
        (item) =>
          (strategy === all || item.strategyId === strategy) &&
          (initiative === all || item.initiativeId === initiative) &&
          (agent === all || item.agentId === agent) &&
          (milestone === all || String(item.milestone) === milestone),
      ),
    [agent, initiative, milestone, strategy, timeline],
  );
  const selected = timeline.find((item) => item.id === selectedId) ?? visible[0] ?? timeline[0];
  const columns = view === "DAY" ? 30 : 5;
  const position = (item: StrategyTimelineItem) => {
    if (view === "DAY")
      return {
        left: `${((item.day - 1) / 30) * 100}%`,
        width: `${Math.max((item.durationDays / 30) * 100, 2.5)}%`,
      };
    const week = Math.floor((item.day - 1) / 7);
    const weekDuration = Math.max(1, Math.ceil(item.durationDays / 7));
    return {
      left: `${(week / 5) * 100}%`,
      width: `${Math.min((weekDuration / 5) * 100, 100 - (week / 5) * 100)}%`,
    };
  };
  return (
    <div className="strategy-stack">
      <section className="timeline-controls">
        <div aria-label="Timeline view"><button aria-pressed={view === "DAY"} onClick={() => setView("DAY")} type="button">Day view</button><button aria-pressed={view === "WEEK"} onClick={() => setView("WEEK")} type="button">Week view</button></div>
        <label>Strategy<select onChange={(event) => { setStrategy(event.target.value); setInitiative(all); }} value={strategy}><option value={all}>All strategies</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></label>
        <label>Initiative<select onChange={(event) => setInitiative(event.target.value)} value={initiative}><option value={all}>All initiatives</option>{initiatives.filter((item) => strategy === all || item.strategyId === strategy).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label>Agent<select onChange={(event) => setAgent(event.target.value)} value={agent}><option value={all}>All agents</option>{workforce.map((item) => <option key={item.agent.id} value={item.agent.id}>{item.agent.id} · {item.agent.name}</option>)}</select></label>
        <label>Milestones<select onChange={(event) => setMilestone(event.target.value)} value={milestone}><option value={all}>All tasks</option><option value="true">Milestones only</option><option value="false">Tasks only</option></select></label>
        <div className="timeline-controls__zoom" aria-label="Timeline zoom"><button aria-pressed={zoom === "COMPACT"} onClick={() => setZoom("COMPACT")} type="button"><ZoomOut aria-hidden="true" size={12} /> Compact</button><button aria-pressed={zoom === "COMFORTABLE"} onClick={() => setZoom("COMFORTABLE")} type="button">Comfortable</button><button aria-pressed={zoom === "DETAIL"} onClick={() => setZoom("DETAIL")} type="button"><ZoomIn aria-hidden="true" size={12} /> Detail</button></div>
      </section>
      <section className={`strategy-timeline strategy-timeline--${zoom.toLowerCase()}`} aria-labelledby="strategy-timeline-title">
        <header><div><span>30-DAY PLAN · {view} VIEW</span><h2 id="strategy-timeline-title">Tasks, milestones, and responsible projections</h2></div><small>{visible.length} of {timeline.length} items</small></header>
        <div className="strategy-timeline__scroll">
          <div className="strategy-timeline__canvas" style={{ "--timeline-columns": columns } as React.CSSProperties}>
            <div className="strategy-timeline__axis"><span />{Array.from({ length: columns }, (_, index) => <b key={index}>{view === "DAY" ? `D${index + 1}` : `W${index + 1}`}</b>)}</div>
            {visible.map((item) => {
              const person = workforce.find((record) => record.agent.id === item.agentId);
              return <button aria-label={`${item.title}, day ${item.day}, ${item.durationDays} days, ${item.executionReality}`} aria-pressed={selected?.id === item.id} className="strategy-timeline__row" key={item.id} onClick={() => setSelectedId(item.id)} type="button"><span className="strategy-timeline__label">{item.milestone ? <Flag aria-label="Milestone" size={11} /> : <CalendarDays aria-hidden="true" size={11} />}<strong>{item.title}</strong><small>{item.agentId} · {person?.agent.name}</small></span><span aria-hidden="true" className="strategy-timeline__track"><i className={`strategy-timeline__bar strategy-timeline__bar--${item.executionReality.toLowerCase()}`} style={position(item)}><b>{item.status.replaceAll("_", " ")}</b></i></span></button>;
            })}
          </div>
        </div>
        {!visible.length ? <aside><Search aria-hidden="true" /><div><strong>No timeline items match</strong><p>Adjust strategy, initiative, agent, or milestone filters.</p></div></aside> : null}
      </section>
      {selected ? (
        <article className="timeline-detail">
          <header><div><span>DRILL-DOWN · {selected.id}</span><h2>{selected.title}</h2></div><ExecutionRealityBadge reality={selected.executionReality} /></header>
          <dl><div><dt>Strategy</dt><dd>{plans.find((plan) => plan.id === selected.strategyId)?.title}</dd></div><div><dt>Initiative</dt><dd>{initiatives.find((item) => item.id === selected.initiativeId)?.title}</dd></div><div><dt>Task</dt><dd>{selected.taskId}</dd></div><div><dt>Agent</dt><dd><Link href={`/agents/${selected.agentId}`}>{selected.agentId} · {workforce.find((item) => item.agent.id === selected.agentId)?.agent.name}</Link></dd></div><div><dt>Window</dt><dd>Day {selected.day}–{selected.day + selected.durationDays - 1}</dd></div><div><dt>Status</dt><dd>{selected.status.replaceAll("_", " ")}</dd></div></dl>
          <p>{selected.provenance.detail}</p>
        </article>
      ) : null}
    </div>
  );
}
