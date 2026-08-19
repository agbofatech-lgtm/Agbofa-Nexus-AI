"use client";
import { useMemo, useState } from "react";
import { ConfidenceBadge } from "@/components/shared/states";
import { Select } from "@/components/ui";
import type { GrowthIntelligenceData } from "@/types/growth-intelligence";
export function AudienceIntelligence({
  data,
}: {
  data: GrowthIntelligenceData;
}) {
  const [stage, setStage] = useState("all");
  const list = useMemo(
    () =>
      data.audiences.filter((x) => stage === "all" || x.lifecycle === stage),
    [data.audiences, stage],
  );
  return (
    <div>
      <Select
        label="Lifecycle"
        onValueChange={setStage}
        options={[
          { value: "all", label: "All segments" },
          { value: "engaged", label: "Engaged" },
          { value: "follower", label: "Follower" },
          { value: "registered", label: "Registered" },
          { value: "subscriber", label: "Subscriber" },
        ]}
        value={stage}
      />
      <section className="audience-grid">
        {list.map((a) => (
          <article key={a.id}>
            <header>
              <span>{a.lifecycle}</span>
              {a.highValue ? <b>High-value model</b> : null}
            </header>
            <h2>{a.name}</h2>
            <strong>
              {a.estimatedSize.toLocaleString()} <small>estimated</small>
            </strong>
            <dl>
              <div>
                <dt>Engagement</dt>
                <dd>{a.engagement}%</dd>
              </div>
              <div>
                <dt>Retention</dt>
                <dd>{a.retention}%</dd>
              </div>
              <div>
                <dt>Conversion</dt>
                <dd>{a.conversion}%</dd>
              </div>
              <div>
                <dt>Growth</dt>
                <dd>+{a.growth}%</dd>
              </div>
            </dl>
            <p>{a.interests.join(" · ")}</p>
            <p>{a.geography.join(" · ")}</p>
            <p>Formats: {a.formats.join(", ")}</p>
            <ConfidenceBadge compact confidence={a.confidence} />
          </article>
        ))}
      </section>
      <aside className="growth-boundary">
        Simulated aggregate audience segments only. No real users or sensitive
        personal profiles.
      </aside>
    </div>
  );
}
