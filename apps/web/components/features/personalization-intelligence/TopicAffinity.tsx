import { TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui";
import type { TopicAffinityPoint } from "@/types/personalization-intelligence";

export function TopicAffinity({ topics }: { topics: TopicAffinityPoint[] }) {
  return (
    <section className="topic-affinity glass">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">
            <TrendingUp size={12} /> Demo interest graph
          </span>
          <h2>Topic affinity</h2>
        </div>
      </div>
      <div>
        {topics.map((topic) => (
          <article key={topic.topic}>
            <div>
              <strong>{topic.topic}</strong>
              {topic.emerging ? <Badge status="queued">emerging</Badge> : null}
              <span>{topic.confidence}% confidence</span>
            </div>
            <i>
              <b style={{ width: `${topic.affinity}%` }} />
            </i>
            <small>{topic.affinity}% affinity</small>
          </article>
        ))}
      </div>
    </section>
  );
}
