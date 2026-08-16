"use client";

import { ArrowUpRight, Clock3, Network } from "lucide-react";
import Image from "next/image";

import { Badge, Skeleton } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils/reader";
import type { StoryDetail } from "@/types/story";

export interface RelatedStoriesProps {
  stories: StoryDetail[];
  onSelect: (id: string) => void;
  loading?: boolean;
}

export function RelatedStories({
  stories,
  onSelect,
  loading = false,
}: RelatedStoriesProps) {
  return (
    <section
      className="related-stories"
      aria-labelledby="related-stories-title"
    >
      <div className="story-section-heading">
        <div>
          <span className="section-kicker">
            <Network size={12} /> Connected intelligence
          </span>
          <h2 id="related-stories-title">Related stories</h2>
        </div>
        <p>
          More reporting connected by topic, entities, and evidence context.
        </p>
      </div>

      {loading ? (
        <div
          className="related-stories__grid"
          aria-label="Loading related stories"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="related-story-card glass">
              <Skeleton height={150} rounded="lg" />
              <Skeleton height={16} rounded="md" width="92%" />
              <Skeleton height={10} rounded="full" width="65%" />
            </div>
          ))}
        </div>
      ) : stories.length ? (
        <div className="related-stories__grid">
          {stories.slice(0, 6).map((story) => (
            <button
              key={story.id}
              className="related-story-card glass-card"
              onClick={() => onSelect(story.id)}
              type="button"
            >
              <span className="related-story-card__image">
                {story.image ? (
                  <Image
                    alt=""
                    fill
                    sizes="(max-width: 720px) 100vw, 33vw"
                    src={story.image}
                  />
                ) : null}
                <Badge category={story.category} variant="category" />
              </span>
              <span className="related-story-card__copy">
                <strong>{story.headline}</strong>
                <small>
                  <span>{story.source}</span>
                  <i />
                  <Clock3 size={11} /> {formatRelativeTime(story.publishedAt)}
                </small>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="related-story-card__arrow"
                size={16}
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="related-stories__empty">No related stories found.</div>
      )}
    </section>
  );
}
