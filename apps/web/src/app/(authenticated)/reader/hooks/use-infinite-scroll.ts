"use client";

import { useEffect, useRef, MutableRefObject } from "react";

export interface UseInfiniteScrollOptions {
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
}

/**
 * useInfiniteScroll attaches an IntersectionObserver to a sentinel element
 * at the end of a scrollable feed, triggering loadMore when the sentinel becomes visible.
 */
export function useInfiniteScroll({
  loadMore,
  hasMore,
  isLoading,
  threshold = 0.5,
}: UseInfiniteScrollOptions): MutableRefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef(loadMore);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry && firstEntry.isIntersecting) {
          loadMoreRef.current();
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, threshold]);

  return sentinelRef;
}

export default useInfiniteScroll;
