"use client";

import { ReaderEmptyState } from "@/components/features/reader/ReaderEmptyState";
import { ReaderErrorState } from "@/components/features/reader/ReaderErrorState";
import { ReaderFeed } from "@/components/features/reader/ReaderFeed";
import { ReaderFeedSkeleton } from "@/components/features/reader/ReaderFeedSkeleton";
import { ReaderHeader } from "@/components/features/reader/ReaderHeader";
import { useReaderFeed } from "@/hooks/useReaderFeed";
import { useReaderStore } from "@/stores/reader-store";

export default function ReaderPage() {
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
  const filters = useReaderStore((state) => state.filters);
  const searchQuery = useReaderStore((state) => state.searchQuery);
  const clearFilters = useReaderStore((state) => state.clearFilters);
  const filtered = Boolean(
    filters.topic || filters.source || searchQuery.trim(),
  );

  return (
    <div className="reader-page">
      <ReaderHeader loading={loading} total={total} />

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
