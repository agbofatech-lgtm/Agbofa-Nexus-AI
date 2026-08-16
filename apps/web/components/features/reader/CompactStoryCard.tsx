import { Clock3 } from "lucide-react";

import { Badge } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils/reader";
import type { Story } from "@/types/reader";

interface CompactStoryCardProps {
  story: Story;
  rank?: number;
}

export function CompactStoryCard({ story, rank }: CompactStoryCardProps) {
  return (
    <article className="compact-story-card" tabIndex={0}>
      {rank ? (
        <span className="compact-story-card__rank">
          {String(rank).padStart(2, "0")}
        </span>
      ) : null}
      <div className="compact-story-card__copy">
        <span>{story.category}</span>
        <h3>{story.headline}</h3>
        <div className="story-meta story-meta--compact">
          <span>{story.source}</span>
          <i />
          <span>
            <Clock3 size={11} /> {story.readingTime} min
          </span>
          <i />
          <time dateTime={story.publishedAt.toISOString()}>
            {formatRelativeTime(story.publishedAt)}
          </time>
        </div>
      </div>
      <Badge verification={story.verification} variant="verification" />
    </article>
  );
}
