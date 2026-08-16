"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { readerService } from "@/lib/services/reader";
import { useReaderStore } from "@/stores/reader-store";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

function useDebouncedValue(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useReaderFeed() {
  const state = useReaderStore();
  const debouncedSearch = useDebouncedValue(
    state.searchQuery,
    SEARCH_DEBOUNCE_MS,
  );
  const requestSequence = useRef(0);
  const activeController = useRef<AbortController | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const requestId = ++requestSequence.current;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;

    state.setLoading(true);
    state.setLoadingMore(false);
    state.setStories([]);
    state.setFeaturedStory(null);
    state.setCursor(null);
    state.setHasMore(true);
    state.setError(null);

    void readerService
      .getFeed({
        sort: state.sort,
        filters: state.filters,
        search: debouncedSearch,
        cursor: null,
        limit: PAGE_SIZE,
        signal: controller.signal,
      })
      .then((response) => {
        if (requestId !== requestSequence.current) return;
        state.setStories(response.stories);
        state.setFeaturedStory(response.featured);
        state.setCursor(response.nextCursor);
        state.setHasMore(response.hasMore);
        state.setTotal(response.total);
      })
      .catch((error: unknown) => {
        if (requestId !== requestSequence.current || isAbortError(error))
          return;
        state.setError(
          error instanceof Error ? error.message : "Failed to load feed.",
        );
      })
      .finally(() => {
        if (requestId === requestSequence.current) state.setLoading(false);
      });

    return () => controller.abort();
    // Store actions are stable; primitive query inputs intentionally drive reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    refreshKey,
    state.filters.source,
    state.filters.topic,
    state.sort,
  ]);

  const loadMore = useCallback(async () => {
    const current = useReaderStore.getState();
    if (
      current.loading ||
      current.loadingMore ||
      !current.hasMore ||
      !current.cursor
    ) {
      return;
    }

    current.setLoadingMore(true);
    const requestId = requestSequence.current;
    const controller = new AbortController();
    activeController.current = controller;

    try {
      const response = await readerService.getFeed({
        sort: current.sort,
        filters: current.filters,
        search: debouncedSearch,
        cursor: current.cursor,
        limit: PAGE_SIZE,
        signal: controller.signal,
      });
      if (requestId !== requestSequence.current) return;
      current.addStories(response.stories);
      current.setCursor(response.nextCursor);
      current.setHasMore(response.hasMore);
      current.setTotal(response.total);
      current.setError(null);
    } catch (error: unknown) {
      if (!isAbortError(error) && requestId === requestSequence.current) {
        current.setError(
          error instanceof Error
            ? error.message
            : "Failed to load more stories.",
        );
      }
    } finally {
      if (requestId === requestSequence.current) current.setLoadingMore(false);
    }
  }, [debouncedSearch]);

  const retry = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const searchPending = state.searchQuery.trim() !== debouncedSearch.trim();

  return {
    stories: state.stories,
    featuredStory: state.featuredStory,
    loading: state.loading || searchPending,
    loadingMore: state.loadingMore,
    error: state.error,
    hasMore: state.hasMore,
    total: state.total,
    loadMore,
    retry,
  };
}
