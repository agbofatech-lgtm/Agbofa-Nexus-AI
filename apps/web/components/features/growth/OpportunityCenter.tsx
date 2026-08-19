"use client";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ConfidenceBadge,
  DomainStatusBadge,
  WorkspaceState,
} from "@/components/shared/states";
import { Input, Select } from "@/components/ui";
import type { GrowthIntelligenceData } from "@/types/growth-intelligence";
export function OpportunityCenter({ data }: { data: GrowthIntelligenceData }) {
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("all");
  const [selected, setSelected] = useState(data.opportunities[0]?.id ?? "");
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (data.opportunities.some((x) => x.id === h)) setSelected(h);
  }, [data.opportunities]);
  const list = useMemo(
    () =>
      data.opportunities
        .filter((x) => risk === "all" || x.risk === risk)
        .filter(
          (x) =>
            !q ||
            `${x.title} ${x.summary}`.toLowerCase().includes(q.toLowerCase()),
        )
        .sort((a, b) => b.score - a.score),
    [data.opportunities, q, risk],
  );
  const item = list.find((x) => x.id === selected) ?? list[0];
  if (!list.length)
    return <WorkspaceState state="empty" title="No matching opportunities" />;
  return (
    <div className="opp-layout">
      <section className="growth-filter">
        <Input
          icon={<Search size={15} />}
          label="Search"
          onChange={setQ}
          type="search"
          value={q}
        />
        <Select
          label="Risk"
          onValueChange={setRisk}
          options={[
            { value: "all", label: "All" },
            { value: "low", label: "Low" },
            { value: "guarded", label: "Guarded" },
          ]}
          value={risk}
        />
      </section>
      <section className="opp-list">
        {list.map((x) => (
          <button
            key={x.id}
            aria-pressed={item?.id === x.id}
            onClick={() => setSelected(x.id)}
            type="button"
          >
            <header>
              <DomainStatusBadge status={x.status} />
              <b>{x.score}</b>
            </header>
            <h2>{x.title}</h2>
            <p>{x.summary}</p>
            <dl>
              <div>
                <dt>Impact</dt>
                <dd>{x.impact}</dd>
              </div>
              <div>
                <dt>Effort</dt>
                <dd>{x.effort}</dd>
              </div>
              <div>
                <dt>Urgency</dt>
                <dd>{x.urgency}</dd>
              </div>
              <div>
                <dt>Risk</dt>
                <dd>{x.risk}</dd>
              </div>
            </dl>
            <ConfidenceBadge compact confidence={x.confidence} />
            <small>{x.agent.agentId} · simulated attribution</small>
          </button>
        ))}
      </section>
      {item ? (
        <article className="opp-detail">
          <header>
            <span>Intelligence briefing</span>
            <h2>{item.title}</h2>
            <ConfidenceBadge confidence={item.confidence} />
          </header>
          <h3>What</h3>
          <p>{item.what}</p>
          <h3>Why</h3>
          <p>{item.why}</p>
          <h3>Evidence</h3>
          {item.evidence.map((e) => (
            <section key={e.id}>
              <strong>{e.label}</strong>
              <p>{e.detail}</p>
            </section>
          ))}
          <div className="growth-decision">
            <span>
              Impact <b>{item.expectedImpact.value}%</b>
            </span>
            <span>
              Cost <b>${item.estimatedCost.amount?.toLocaleString()}</b>
            </span>
            <span>
              Risk <b>{item.risk}</b>
            </span>
          </div>
          <footer>
            <strong>{item.recommendedAction}</strong>
            <p>Recommendation preview only. No execution occurs.</p>
          </footer>
        </article>
      ) : null}
    </div>
  );
}
