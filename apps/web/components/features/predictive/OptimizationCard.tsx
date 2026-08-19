import { Clock3, FileText, Heading, Image, Target } from "lucide-react";

import type { OptimizationRecommendation } from "@/types/predictive";

const icons = {
  headline: Heading,
  "publishing-time": Clock3,
  content: FileText,
  media: Image,
  audience: Target,
} as const;

export function OptimizationCard({
  recommendations,
}: {
  recommendations: OptimizationRecommendation[];
}) {
  return (
    <section
      className="optimization-card glass"
      aria-labelledby="optimization-title"
    >
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">Demo recommendations</span>
          <h2 id="optimization-title">Optimization opportunities</h2>
        </div>
      </div>
      <div>
        {recommendations.map((item) => {
          const Icon = icons[item.type];
          return (
            <article key={item.id}>
              <span>
                <Icon size={15} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.recommendation}</p>
              </div>
              <aside>
                <b>+{item.expectedLift}%</b>
                <small>{item.confidence}% confidence</small>
              </aside>
            </article>
          );
        })}
      </div>
    </section>
  );
}
