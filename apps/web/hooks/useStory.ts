"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { StoryNotFoundError, storyService } from "@/lib/services/story";
import { useStoryStore } from "@/stores/story-store";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useStory(id: string) {
  const state = useStoryStore();
  const requestSequence = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const requestId = ++requestSequence.current;
    const controller = new AbortController();

    state.reset();
    state.setLoading(true);

    void Promise.all([
      storyService.getStory(id, controller.signal),
      storyService.getRelatedStories(id, 6, controller.signal),
    ])
      .then(([story, relatedStories]) => {
        if (requestId !== requestSequence.current) return;
        state.setStory(story);
        state.setRelatedStories(relatedStories);
        state.setError(null);
        state.setNotFound(false);
      })
      .catch((error: unknown) => {
        if (requestId !== requestSequence.current || isAbortError(error))
          return;
        if (error instanceof StoryNotFoundError) {
          state.setNotFound(true);
          state.setError(null);
          return;
        }
        state.setError(
          error instanceof Error ? error.message : "Failed to load story.",
        );
      })
      .finally(() => {
        if (requestId === requestSequence.current) state.setLoading(false);
      });

    return () => controller.abort();
    // Store actions are stable; id and refreshKey intentionally control requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refreshKey]);

  const retry = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return {
    story: state.story,
    relatedStories: state.relatedStories,
    loading: state.loading,
    error: state.error,
    notFound: state.notFound,
    retry,
  };
}
