import { ArrowRight, Coins, ShieldAlert, Target } from "lucide-react";
import Link from "next/link";
import { ConfidenceBadge } from "@/components/shared/states";
import type { GrowthIntelligenceData } from "@/types/growth-intelligence";
export function GrowthOverview({ data }: { data: GrowthIntelligenceData }) {
  const evidence = data.evidence.filter((x) =>
    data.recommendation.evidenceIds.includes(x.id),
  );
  const top = [...data.opportunities].sort((a, b) => b.score - a.score)[0];
  return (
    <div className="growth-overview">
      <section className="growth-metrics">
        {data.metrics.map((m) => (
          <article key={m.id}>
            <span>{m.label}</span>
            <strong>{m.displayValue}</strong>
            <p>
              {m.change >= 0 ? "+" : ""}
              {m.change}% · {m.period}
            </p>
            <ConfidenceBadge compact confidence={m.confidence} />
          </article>
        ))}
      </section>
      <section className="growth-insight">
        <header>
          <span>Simulated Growth Intelligence</span>
          <ConfidenceBadge confidence={data.recommendation.confidence} />
        </header>
        <h2>{data.recommendation.title}</h2>
        <p>{data.recommendation.why}</p>
        <div className="growth-evidence">
          {evidence.map((x) => (
            <article key={x.id}>
              <strong>{x.signal}</strong>
              <p>{x.observation}</p>
              <small>
                {x.source} · {new Date(x.timestamp).toLocaleDateString()}
              </small>
            </article>
          ))}
        </div>
        <div className="growth-decision">
          <span>
            <Target size={14} />
            Impact <b>{data.recommendation.impact.value}%</b>
          </span>
          <span>
            <Coins size={14} />
            Cost <b>${data.recommendation.cost.amount?.toLocaleString()}</b>
          </span>
          <span>
            <ShieldAlert size={14} />
            Risk <b>{data.recommendation.risk}</b>
          </span>
        </div>
        <footer>
          <strong>{data.recommendation.nextAction}</strong>
          <Link href="/growth/opportunities">
            Review opportunities <ArrowRight size={14} />
          </Link>
        </footer>
      </section>
      {top ? (
        <section className="growth-top">
          <span>Priority opportunity</span>
          <h2>{top.title}</h2>
          <p>{top.why}</p>
          <strong>Score {top.score}/100</strong>
          <Link href={`/growth/opportunities#${top.id}`}>
            Open briefing <ArrowRight size={14} />
          </Link>
        </section>
      ) : null}
      <section className="growth-forecasts">
        <header>
          <span>Forecast simulations</span>
          <h2>30 / 60 / 90-day audience scenarios</h2>
        </header>
        {data.forecasts.map((f) => (
          <article key={f.id}>
            <b>{f.days} days</b>
            <strong>{f.projected.toLocaleString()}</strong>
            <span>
              {f.range.minimum.toLocaleString()}–
              {f.range.maximum.toLocaleString()}
            </span>
            <ConfidenceBadge compact confidence={f.confidence} />
          </article>
        ))}
      </section>
    </div>
  );
}
