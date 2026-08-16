import { Clock3, ShieldCheck } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui";
import { confidenceBand, formatRelativeTime } from "@/lib/utils/reader";
import type { Story } from "@/types/reader";

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  return (
    <article className="reader-story-card glass-card" tabIndex={0}>
      <div className="reader-story-card__image">
        {story.image ? (
          <Image
            alt={`${story.category} editorial illustration`}
            fill
            sizes="(max-width: 720px) 100vw, (max-width: 1180px) 50vw, 33vw"
            src={story.image}
          />
        ) : null}
        <Badge category={story.category} variant="category" />
      </div>
      <div className="reader-story-card__content">
        <h3>{story.headline}</h3>
        <p>{story.summary}</p>
        <div className="story-meta story-meta--card">
          <span>{story.source}</span>
          <i />
          <span>
            <Clock3 size={12} /> {story.readingTime} min
          </span>
          <i />
          <time dateTime={story.publishedAt.toISOString()}>
            {formatRelativeTime(story.publishedAt)}
          </time>
        </div>
        <div className="reader-story-card__trust">
          <Badge verification={story.verification} variant="verification" />
          <span
            className={`confidence-score confidence-score--${confidenceBand(story.confidence)}`}
          >
            <ShieldCheck size={12} /> {story.confidence}% confidence
          </span>
        </div>
      </div>
    </article>
  );
}
