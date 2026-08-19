"use client";
import { useState } from "react";
import { ConfidenceBadge } from "@/components/shared/states";
import type { GrowthIntelligenceData } from "@/types/growth-intelligence";
export function CompetitorIntelligence({
  data,
}: {
  data: GrowthIntelligenceData;
}) {
  const [id, setId] = useState(data.competitors[0]?.id ?? "");
  const selected =
    data.competitors.find((x) => x.id === id) ?? data.competitors[0];
  return (
    <div>
      <aside className="growth-boundary">
        <strong>Public intelligence boundary.</strong> Synthetic profiles only;
        no private analytics, audience, revenue, dashboards, or strategy access.
      </aside>
      <div className="competitor-layout">
        <section className="competitor-list">
          {data.competitors.map((c) => (
            <button
              key={c.id}
              aria-pressed={selected?.id === c.id}
              onClick={() => setId(c.id)}
              type="button"
            >
              <strong>{c.name}</strong>
              <p>{c.publishingPattern}</p>
              <ConfidenceBadge compact confidence={c.confidence} />
            </button>
          ))}
        </section>
        {selected ? (
          <article className="competitor-detail">
            <header>
              <h2>{selected.name}</h2>
              <ConfidenceBadge confidence={selected.confidence} />
            </header>
            <h3>Public topic coverage simulation</h3>
            {selected.themes.map((t) => (
              <div className="competitor-topic" key={t.label}>
                <span>{t.label}</span>
                <i>
                  <b style={{ width: `${t.coverage}%` }} />
                </i>
                <strong>{t.coverage}</strong>
              </div>
            ))}
            <div className="competitor-columns">
              <section>
                <h3>Strengths</h3>
                <ul>
                  {selected.strengths.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Coverage gaps</h3>
                <ul>
                  {selected.gaps.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
            </div>
            <p>Engagement signal {selected.engagementSignal}/100 · simulated</p>
          </article>
        ) : null}
      </div>
    </div>
  );
}
