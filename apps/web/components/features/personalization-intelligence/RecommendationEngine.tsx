import { ArrowUpRight, MousePointerClick, Sparkles } from "lucide-react";

import type { PersonalizedStory } from "@/types/personalization";
import type { RecommendationPerformance } from "@/types/personalization-intelligence";

interface RecommendationEngineProps {
  performance: RecommendationPerformance[];
  currentRecommendations: PersonalizedStory[];
}

export function RecommendationEngine({
  performance,
  currentRecommendations,
}: RecommendationEngineProps) {
  return (
    <section className="recommendation-engine glass">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">
            <Sparkles size={12} /> Demo ranking analysis
          </span>
          <h2>Recommendation engine</h2>
        </div>
        <span>
          {currentRecommendations.length} current Reader recommendations
        </span>
      </div>
      <ol>
        {performance.map((item) => (
          <li key={item.title}>
            <span>{item.rank}</span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.category}</small>
            </div>
            <div>
              <b>
                <MousePointerClick size={11} /> {item.ctr}% CTR
              </b>
              <small>{item.confidence}% confidence</small>
            </div>
            <ArrowUpRight size={14} />
          </li>
        ))}
      </ol>
    </section>
  );
}
