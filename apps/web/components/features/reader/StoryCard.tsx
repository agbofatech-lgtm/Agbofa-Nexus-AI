import { Clock3, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { WatermarkedImage } from "@/components/shared/media/WatermarkedImage";
import { Badge } from "@/components/ui";
import { confidenceBand, formatRelativeTime } from "@/lib/utils/reader";
import type { Story } from "@/types/reader";

interface StoryCardProps {
  story: Story;
  onSelect?: (id: string) => void;
}

export function StoryCard({ story, onSelect }: StoryCardProps) {
  return (
    <Link
      aria-label={`Read story: ${story.headline}`}
      className="reader-story-card glass-card"
      href={`/reader/${story.id}`}
      onClick={
        onSelect
          ? (event) => {
              event.preventDefault();
              onSelect(story.id);
            }
          : undefined
      }
    >
      <div className="reader-story-card__image">
        <WatermarkedImage
          alt={`${story.category} editorial illustration for ${story.headline}`}
          fill
          sizes="(max-width: 720px) 100vw, (max-width: 1180px) 50vw, 33vw"
          src={story.image}
          watermarkVariant="mini"
        />
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
    </Link>
  );
}
