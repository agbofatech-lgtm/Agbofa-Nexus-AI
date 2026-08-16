"use client";

import { CheckCircle2, LoaderCircle, Radio } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { CompactStoryCard } from "@/components/features/reader/CompactStoryCard";
import { FeaturedStory } from "@/components/features/reader/FeaturedStory";
import { ReaderFeedSkeleton } from "@/components/features/reader/ReaderFeedSkeleton";
import { StoryCard } from "@/components/features/reader/StoryCard";
import { Button } from "@/components/ui";
import type { Story } from "@/types/reader";

interface ReaderFeedProps {
  stories: Story[];
  featured: Story | null;
  loadingMore: boolean;
  hasMore: boolean;
  total: number;
  onLoadMore: () => void;
}

export function ReaderFeed({
  stories,
  featured,
  loadingMore,
  hasMore,
  total,
  onLoadMore,
}: ReaderFeedProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const feedStories = useMemo(
    () => stories.filter((story) => story.id !== featured?.id),
    [featured?.id, stories],
  );
  const standardStories = feedStories.filter(
    (_, index) => (index + 1) % 5 !== 0,
  );
  const compactStories = feedStories.filter(
    (_, index) => (index + 1) % 5 === 0,
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: "600px 0px 600px", threshold: 0.01 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <section className="reader-feed" aria-label="Personalized story feed">
      {featured ? <FeaturedStory story={featured} /> : null}

      <div className="reader-feed__section-heading">
        <div>
          <span className="section-kicker">
            <Radio size={12} /> Live briefing
          </span>
          <h2>Stories selected for you</h2>
        </div>
        <span>
          {stories.length} of {total} loaded
        </span>
      </div>

      <div className="reader-story-grid">
        {standardStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {compactStories.length ? (
        <aside
          className="reader-quick-reads glass"
          aria-labelledby="quick-reads-title"
        >
          <div className="reader-quick-reads__heading">
            <span className="section-kicker">Quick reads</span>
            <h2 id="quick-reads-title">More signals in your briefing</h2>
          </div>
          <div>
            {compactStories.map((story, index) => (
              <CompactStoryCard key={story.id} rank={index + 1} story={story} />
            ))}
          </div>
        </aside>
      ) : null}

      <div
        ref={sentinelRef}
        className="reader-feed__sentinel"
        aria-hidden="true"
      />

      {loadingMore ? <ReaderFeedSkeleton compact /> : null}

      {hasMore ? (
        <div className="reader-feed__load-more">
          <Button disabled={loadingMore} onClick={onLoadMore} variant="ghost">
            {loadingMore ? (
              <LoaderCircle className="reader-spin" size={15} />
            ) : null}
            {loadingMore ? "Loading more stories" : "Load more intelligence"}
          </Button>
          <span>More stories load automatically as you scroll.</span>
        </div>
      ) : (
        <div className="reader-feed__end" role="status">
          <span>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>You’ve reached the end.</strong>
            <p>
              Every available story is in view. Check back later for new
              verified intelligence.
            </p>
          </div>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {loadingMore
          ? "Loading more stories."
          : hasMore
            ? `${stories.length} of ${total} stories loaded.`
            : `All ${stories.length} stories loaded.`}
      </div>
    </section>
  );
}
