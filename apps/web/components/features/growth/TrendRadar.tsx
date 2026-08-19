"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ConfidenceBadge } from "@/components/shared/states";
import { Select } from "@/components/ui";
import type { GrowthIntelligenceData } from "@/types/growth-intelligence";
export function TrendRadar({ data }: { data: GrowthIntelligenceData }) {
  const [sort, setSort] = useState("score");
  const [selected, setSelected] = useState(data.trends[0]?.id ?? "");
  const list = useMemo(
    () =>
      [...data.trends].sort((a, b) =>
        sort === "velocity"
          ? b.velocity - a.velocity
          : sort === "relevance"
            ? b.relevance - a.relevance
            : b.opportunityScore - a.opportunityScore,
      ),
    [data.trends, sort],
  );
  const item = list.find((x) => x.id === selected) ?? list[0];
  return (
    <div className="trend-layout">
      <Select
        label="Sort trends"
        onValueChange={setSort}
        options={[
          { value: "score", label: "Opportunity" },
          { value: "velocity", label: "Velocity" },
          { value: "relevance", label: "Relevance" },
        ]}
        value={sort}
      />
      <section className="trend-list">
        {list.map((x) => (
          <button
            key={x.id}
            aria-pressed={item?.id === x.id}
            onClick={() => setSelected(x.id)}
            type="button"
          >
            <b>{x.opportunityScore}</b>
            <div>
              <strong>{x.topic}</strong>
              <small>
                {x.category} · {x.lifecycle}
              </small>
            </div>
            <span>Velocity {x.velocity}</span>
            <span>Relevance {x.relevance}</span>
            <em>+{x.acceleration}%</em>
          </button>
        ))}
      </section>
      {item ? (
        <article className="trend-detail">
          <header>
            <h2>{item.topic}</h2>
            <ConfidenceBadge confidence={item.confidence} />
          </header>
          <div className="trend-signals">
            <span>
              Velocity <b>{item.velocity}</b>
            </span>
            <span>
              Competition <b>{item.competition}</b>
            </span>
            <span>
              Coverage <b>{item.coverage}</b>
            </span>
            <span>
              Opportunity <b>{item.opportunityScore}</b>
            </span>
          </div>
          <p>{item.geography.join(" · ")}</p>
          <h3>Evidence</h3>
          {data.evidence
            .filter((e) => item.evidenceIds.includes(e.id))
            .map((e) => (
              <section key={e.id}>
                <strong>{e.signal}</strong>
                <p>{e.observation}</p>
              </section>
            ))}
          <p>{item.agent.agentId} · simulated attribution</p>
          {item.relatedStoryIds.map((id) => (
            <Link key={id} href={`/reader/${id}`}>
              {id}
            </Link>
          ))}
        </article>
      ) : null}
    </div>
  );
}
