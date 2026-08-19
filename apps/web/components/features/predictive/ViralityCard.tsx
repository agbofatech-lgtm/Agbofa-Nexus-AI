import { ArrowUpRight, Radio, Users } from "lucide-react";

import { Badge } from "@/components/ui";
import type { ViralityPrediction } from "@/types/predictive";

export function ViralityCard({
  prediction,
}: {
  prediction: ViralityPrediction;
}) {
  return (
    <article className="prediction-hero-card glass-gold">
      <div>
        <span className="section-kicker">
          <Radio size={12} /> Demo virality prediction
        </span>
        <Badge status="queued">{prediction.status}</Badge>
      </div>
      <div className="prediction-score">
        <strong>{prediction.score}</strong>
        <span>/100 virality score</span>
      </div>
      <dl>
        <div>
          <dt>
            <Users size={13} /> Expected reach
          </dt>
          <dd>{(prediction.expectedReach / 1_000_000).toFixed(2)}M</dd>
        </div>
        <div>
          <dt>
            <ArrowUpRight size={13} /> Direction
          </dt>
          <dd>{prediction.direction}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{prediction.confidence}%</dd>
        </div>
      </dl>
      <i>
        <b style={{ width: `${prediction.score}%` }} />
      </i>
    </article>
  );
}
