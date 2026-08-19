"use client";

import { AlertTriangle, Filter, Info, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type {
  ExecutiveActivityEvent,
  ExecutiveSeverity,
} from "@/types/executive-command";

const icons = { INFO: Info, WARNING: AlertTriangle, CRITICAL: ShieldAlert } as const;

export function ExecutiveActivityCenter({ events }: { events: ExecutiveActivityEvent[] }) {
  const [severity, setSeverity] = useState<"ALL" | ExecutiveSeverity>("ALL");
  const visible = events.filter((event) => severity === "ALL" || event.severity === severity);
  return (
    <section className="executive-activity" aria-labelledby="executive-activity-title">
      <header><div><span>GLOBAL ACTIVITY</span><h2 id="executive-activity-title">Deterministic cross-system history</h2></div><label><Filter aria-hidden="true" size={12} /> Severity<select onChange={(event) => setSeverity(event.target.value as "ALL" | ExecutiveSeverity)} value={severity}><option>ALL</option><option>INFO</option><option>WARNING</option><option>CRITICAL</option></select></label></header>
      <ol>{visible.map((event) => { const Icon = icons[event.severity]; return <li className={`executive-activity__event executive-activity__event--${event.severity.toLowerCase()}`} key={event.id}><time dateTime={event.timestamp}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.timestamp))}</time><span><Icon aria-hidden="true" /></span><div><header><b>{event.domain}</b><strong>{event.title}</strong></header><p>{event.description}</p><small>{event.sourceId} · {event.status.replaceAll("_", " ")}</small></div><aside><ExecutionRealityBadge reality={event.executionReality} /><DataSourceIndicator provenance={event.provenance} /></aside></li>; })}</ol>
    </section>
  );
}
