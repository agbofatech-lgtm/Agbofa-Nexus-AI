import { ArrowLeft, CalendarDays, Clock3, UserRound } from "lucide-react";
import Link from "next/link";

import { ConfidenceMeter } from "@/components/features/story/ConfidenceMeter";
import { Badge } from "@/components/ui";
import type { StoryCategory, StoryVerification } from "@/types/reader";

export interface StoryHeaderProps {
  category: StoryCategory;
  headline: string;
  subheadline?: string;
  source: string;
  author?: string;
  publishedAt: Date;
  readingTime: number;
  verification: StoryVerification;
  confidence: number;
}

export function StoryHeader({
  category,
  headline,
  subheadline,
  source,
  author,
  publishedAt,
  readingTime,
  verification,
  confidence,
}: StoryHeaderProps) {
  const formattedDate = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(publishedAt);

  return (
    <header className="story-header">
      <Link className="story-back-link" href="/reader">
        <ArrowLeft size={15} /> Back to Reader
      </Link>
      <div className="story-header__badges">
        <Badge category={category} variant="category" />
        <Badge verification={verification} variant="verification" />
      </div>
      <h1>{headline}</h1>
      {subheadline ? (
        <p className="story-header__subheadline">{subheadline}</p>
      ) : null}
      <div className="story-header__footer">
        <div className="story-byline">
          <span className="story-byline__source">{source}</span>
          {author ? (
            <span>
              <UserRound size={13} /> {author}
            </span>
          ) : null}
          <time dateTime={publishedAt.toISOString()}>
            <CalendarDays size={13} /> {formattedDate}
          </time>
          <span>
            <Clock3 size={13} /> {readingTime} min read
          </span>
        </div>
        <ConfidenceMeter score={confidence} size="small" showLevel />
      </div>
    </header>
  );
}
