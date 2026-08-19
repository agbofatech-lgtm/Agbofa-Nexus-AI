import { Clock3, Layers3, MousePointerClick, ScrollText } from "lucide-react";

import type { FeedIntelligence as FeedData } from "@/types/personalization-intelligence";

export function FeedIntelligence({ data }: { data: FeedData }) {
  const items = [
    {
      label: "Session duration",
      value: `${data.averageSessionMinutes}m`,
      icon: Clock3,
    },
    {
      label: "Feed engagement",
      value: `${data.feedEngagement}%`,
      icon: MousePointerClick,
    },
    {
      label: "Content diversity",
      value: `${data.contentDiversity}%`,
      icon: Layers3,
    },
    {
      label: "Scroll depth",
      value: `${data.averageScrollDepth}%`,
      icon: ScrollText,
    },
  ];
  return (
    <section className="feed-intelligence glass">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">Example behavior</span>
          <h2>Feed intelligence</h2>
        </div>
      </div>
      <div>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label}>
              <Icon size={17} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
