import { ArrowUpRight, Clock3, ShieldCheck } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui";
import { confidenceBand, formatRelativeTime } from "@/lib/utils/reader";
import type { Story } from "@/types/reader";

interface FeaturedStoryProps {
  story: Story;
}

export function FeaturedStory({ story }: FeaturedStoryProps) {
  const band = confidenceBand(story.confidence);

  return (
    <article
      aria-label={`Featured story: ${story.headline}`}
      className="featured-story"
      tabIndex={0}
    >
      <div className="featured-story__image">
        {story.image ? (
          <Image
            alt={`${story.category} editorial illustration for ${story.headline}`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
            src={story.image}
          />
        ) : null}
        <div className="featured-story__scrim" />
        <span className="featured-story__signal">
          <span /> Featured intelligence
        </span>
      </div>
      <div className="featured-story__content">
        <div className="featured-story__badges">
          <Badge category={story.category} variant="category" />
          <Badge verification={story.verification} variant="verification" />
        </div>
        <h2>{story.headline}</h2>
        <p>{story.summary}</p>
        <div className="story-meta">
          <span>{story.source}</span>
          <i />
          <span>
            <Clock3 size={13} /> {story.readingTime} min read
          </span>
          <i />
          <time dateTime={story.publishedAt.toISOString()}>
            {formatRelativeTime(story.publishedAt)}
          </time>
        </div>
        <div className="confidence-meter" data-band={band}>
          <div className="confidence-meter__heading">
            <span>
              <ShieldCheck size={14} /> Evidence confidence
            </span>
            <strong>{story.confidence}%</strong>
          </div>
          <div
            aria-label={`${story.confidence}% confidence`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={story.confidence}
            className="confidence-meter__track"
            role="progressbar"
          >
            <span style={{ width: `${story.confidence}%` }} />
          </div>
        </div>
        <span aria-hidden="true" className="featured-story__open">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </article>
  );
}
