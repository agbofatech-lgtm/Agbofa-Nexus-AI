import { ArrowDownRight, ArrowUpRight, Minus, TrendingUp } from "lucide-react";

import type { TrendTopic } from "@/types/predictive";

const icons = {
  up: ArrowUpRight,
  stable: Minus,
  down: ArrowDownRight,
} as const;

export function TrendAnalysis({ trends }: { trends: TrendTopic[] }) {
  return (
    <section className="trend-analysis glass">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">
            <TrendingUp size={12} /> Demo topic velocity
          </span>
          <h2>Emerging trends</h2>
        </div>
        <span>{trends.length} topics</span>
      </div>
      <div>
        {trends.map((trend) => {
          const Icon = icons[trend.direction];
          return (
            <article key={trend.id}>
              <span
                className={`trend-direction trend-direction--${trend.direction}`}
              >
                <Icon size={14} />
              </span>
              <div>
                <strong>{trend.topic}</strong>
                <small>
                  {trend.category} · {trend.seasonalPattern}
                </small>
              </div>
              <div>
                <b>{trend.velocity}</b>
                <span>velocity</span>
              </div>
              <div>
                <b>{trend.confidence}%</b>
                <span>confidence</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
