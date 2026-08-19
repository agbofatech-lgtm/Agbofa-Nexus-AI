"use client";

import { AlertTriangle, Newspaper, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { BecauseYouRead } from "@/components/features/personalization/BecauseYouRead";
import { ForYouSection } from "@/components/features/personalization/ForYouSection";
import { PersonalizationEmptyState } from "@/components/features/personalization/PersonalizationEmptyState";
import { PersonalizationSkeleton } from "@/components/features/personalization/PersonalizationSkeleton";
import { ReaderPreferences } from "@/components/features/personalization/ReaderPreferences";
import { ReadingHistory } from "@/components/features/personalization/ReadingHistory";
import { Recommendations } from "@/components/features/personalization/Recommendations";
import { ReaderEmptyState } from "@/components/features/reader/ReaderEmptyState";
import { ReaderErrorState } from "@/components/features/reader/ReaderErrorState";
import { ReaderFeed } from "@/components/features/reader/ReaderFeed";
import { ReaderFeedSkeleton } from "@/components/features/reader/ReaderFeedSkeleton";
import { ReaderHeader } from "@/components/features/reader/ReaderHeader";
import { Button } from "@/components/ui";
import { usePersonalization } from "@/hooks/usePersonalization";
import { useReaderFeed } from "@/hooks/useReaderFeed";
import { useReaderStore } from "@/stores/reader-store";
import type { ReaderPreferencesData } from "@/types/personalization";

function preferenceSignature(preferences: ReaderPreferencesData): string {
  return JSON.stringify({
    topics: [...preferences.topics].sort(),
    sources: [...preferences.sources].sort(),
  });
}

export default function ReaderPage() {
  const router = useRouter();
  const {
    stories,
    featuredStory,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    loadMore,
    retry,
  } = useReaderFeed();
  const personalization = usePersonalization();
  const filters = useReaderStore((state) => state.filters);
  const searchQuery = useReaderStore((state) => state.searchQuery);
  const clearFilters = useReaderStore((state) => state.clearFilters);
  const filtered = Boolean(
    filters.topic || filters.source || searchQuery.trim(),
  );
  const preferencesDirty =
    preferenceSignature(personalization.preferences) !==
    preferenceSignature(personalization.savedPreferences);
  const openStory = (id: string) => router.push(`/reader/${id}`);

  return (
    <div className="reader-page">
      <ReaderHeader loading={loading} total={total} />

      <div className="personalization-layer">
        <ReaderPreferences
          dirty={preferencesDirty}
          loading={personalization.loading.catalog}
          onSave={() => void personalization.savePreferences()}
          onSourceToggle={personalization.toggleSource}
          onTopicToggle={personalization.toggleTopic}
          saving={personalization.loading.saving}
          selectedSources={personalization.preferences.sources}
          selectedTopics={personalization.preferences.topics}
          sources={personalization.sources}
          successMessage={personalization.saveMessage}
          topics={personalization.topics}
        />

        {personalization.error ? (
          <div className="personalization-error glass" role="alert">
            <span>
              <AlertTriangle size={20} />
            </span>
            <div>
              <strong>Personalization is temporarily unavailable.</strong>
              <p>{personalization.error}</p>
            </div>
            <Button onClick={personalization.retry} size="sm" variant="ghost">
              <RefreshCw size={13} /> Retry
            </Button>
          </div>
        ) : null}

        <ForYouSection
          loading={personalization.loading.forYou}
          onSelect={openStory}
          stories={personalization.forYou}
        />

        {personalization.loading.becauseYouRead ? (
          <section
            className="personalization-section"
            aria-label="Loading contextual recommendations"
          >
            <PersonalizationSkeleton count={3} />
          </section>
        ) : personalization.becauseYouRead.story ? (
          <BecauseYouRead
            loading={false}
            onSelect={openStory}
            recommendations={personalization.becauseYouRead.recommendations}
            sourceStory={personalization.becauseYouRead.story}
          />
        ) : (
          <section className="personalization-section">
            <PersonalizationEmptyState
              title="No reading context yet."
              description="Open a story to start a contextual recommendation path."
            />
          </section>
        )}

        <Recommendations
          loading={personalization.loading.recommendations}
          onSelect={openStory}
          stories={personalization.recommendations}
        />

        <ReadingHistory
          loading={personalization.loading.history}
          onSelect={openStory}
          stories={personalization.readingHistory}
        />
      </div>

      <div className="reader-main-feed-divider">
        <span>
          <Newspaper size={18} />
        </span>
        <h2>Full intelligence feed</h2>
        <p>Filter, search, and explore all verified stories.</p>
      </div>

      {loading ? <ReaderFeedSkeleton /> : null}

      {!loading && error ? (
        <ReaderErrorState message={error} onRetry={retry} />
      ) : null}

      {!loading && !error && stories.length === 0 ? (
        <ReaderEmptyState filtered={filtered} onReset={clearFilters} />
      ) : null}

      {!loading && !error && stories.length > 0 ? (
        <ReaderFeed
          featured={featuredStory}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          stories={stories}
          total={total}
        />
      ) : null}
    </div>
  );
}
