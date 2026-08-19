import Link from "next/link";
import { ConfidenceBadge } from "@/components/shared/states";
import type { GrowthIntelligenceData } from "@/types/growth-intelligence";
export function ContentGapIntelligence({
  data,
}: {
  data: GrowthIntelligenceData;
}) {
  return (
    <div className="gap-view">
      <section className="gap-flow">
        <b>Audience demand</b>
        <span>→</span>
        <b>Existing content</b>
        <span>→</span>
        <b>Competitor coverage</b>
        <span>→</span>
        <b>Opportunity</b>
        <span>→</span>
        <b>Recommended content</b>
      </section>
      {data.gaps.map((g) => (
        <article key={g.id}>
          <header>
            <h2>{g.topic}</h2>
            <ConfidenceBadge confidence={g.confidence} />
          </header>
          <div className="gap-bars">
            <span>
              Demand{" "}
              <i>
                <b style={{ width: `${g.demand}%` }} />
              </i>
              {g.demand}
            </span>
            <span>
              Competitors{" "}
              <i>
                <b style={{ width: `${g.competitorCoverage}%` }} />
              </i>
              {g.competitorCoverage}
            </span>
            <span>
              Agbofa{" "}
              <i>
                <b style={{ width: `${g.agbofaCoverage}%` }} />
              </i>
              {g.agbofaCoverage}
            </span>
            <span>
              Gap{" "}
              <i>
                <b style={{ width: `${g.gap}%` }} />
              </i>
              {g.gap}
            </span>
          </div>
          <dl>
            <div>
              <dt>Format</dt>
              <dd>{g.format}</dd>
            </div>
            <div>
              <dt>Angle</dt>
              <dd>{g.angle}</dd>
            </div>
            <div>
              <dt>Platform</dt>
              <dd>{g.platform}</dd>
            </div>
            <div>
              <dt>Expected impact</dt>
              <dd>{g.expectedImpact}</dd>
            </div>
          </dl>
          <Link href={`/growth/opportunities#${g.opportunityId}`}>
            Review opportunity
          </Link>
        </article>
      ))}
      <section className="dna-view">
        <header>
          <h2>Content DNA projection</h2>
          <p>Existing Reader and Truth intelligence remain canonical.</p>
        </header>
        {data.contentDNA.map((d) => (
          <article key={d.id}>
            <Link href={`/reader/${d.contentId}`}>
              <strong>{d.title}</strong>
            </Link>
            <p>
              {d.topic} · {d.tone} · {d.format}
            </p>
            <div>
              <span>
                Audience fit <b>{d.audienceFit}</b>
              </span>
              <span>
                Trend <b>{d.trendRelevance}</b>
              </span>
            </div>
            <small>Strengths: {d.strengths.join(", ")}</small>
            <small>Adaptations: {d.adaptations.join(", ")}</small>
            <ConfidenceBadge compact confidence={d.confidence} />
          </article>
        ))}
      </section>
    </div>
  );
}
