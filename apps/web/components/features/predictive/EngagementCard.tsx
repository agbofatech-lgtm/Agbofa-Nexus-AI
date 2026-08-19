import { Heart, MessageCircle, MousePointerClick, Share2 } from "lucide-react";

import type { EngagementPrediction } from "@/types/predictive";

export function EngagementCard({
  prediction,
}: {
  prediction: EngagementPrediction;
}) {
  const items = [
    {
      label: "Expected likes",
      value: prediction.likes.toLocaleString(),
      icon: Heart,
    },
    {
      label: "Comments",
      value: prediction.comments.toLocaleString(),
      icon: MessageCircle,
    },
    {
      label: "Shares",
      value: prediction.shares.toLocaleString(),
      icon: Share2,
    },
    { label: "CTR", value: `${prediction.ctr}%`, icon: MousePointerClick },
  ];
  return (
    <article className="engagement-card glass">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">Example engagement</span>
          <h2>Engagement prediction</h2>
        </div>
        <strong>{prediction.engagementRate}% rate</strong>
      </div>
      <div>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <section key={item.label}>
              <Icon size={15} />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </section>
          );
        })}
      </div>
      <footer>
        Demo confidence <strong>{prediction.confidence}%</strong>
      </footer>
    </article>
  );
}
