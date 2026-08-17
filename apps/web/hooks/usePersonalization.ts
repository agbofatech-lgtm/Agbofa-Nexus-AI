"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { personalizationService } from "@/lib/services/personalization";
import { usePersonalizationStore } from "@/stores/personalization-store";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function usePersonalization() {
  const state = usePersonalizationStore();
  const saveMessage = state.saveMessage;
  const setSaveMessage = state.setSaveMessage;
  const requestSequence = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const requestId = ++requestSequence.current;
    const controller = new AbortController();
    const loadingKeys = [
      "catalog",
      "forYou",
      "becauseYouRead",
      "recommendations",
      "history",
    ] as const;

    loadingKeys.forEach((key) => state.setLoading(key, true));
    state.setError(null);

    void Promise.all([
      personalizationService.getPreferences(controller.signal),
      personalizationService.getTopics(controller.signal),
      personalizationService.getSources(controller.signal),
      personalizationService.getReadingHistory(controller.signal),
    ])
      .then(async ([preferences, topics, sources, history]) => {
        if (requestId !== requestSequence.current) return;
        state.setPreferences(preferences);
        state.setSavedPreferences(preferences);
        state.setTopics(topics);
        state.setSources(sources);
        state.setReadingHistory(history);
        state.setLoading("catalog", false);
        state.setLoading("history", false);

        const [forYou, becauseYouRead, recommendations] = await Promise.all([
          personalizationService.getForYou(preferences, controller.signal),
          personalizationService.getBecauseYouRead(
            history[0]?.story.id ?? "story-001",
            controller.signal,
          ),
          personalizationService.getRecommendations(
            preferences,
            controller.signal,
          ),
        ]);
        if (requestId !== requestSequence.current) return;
        state.setForYou(forYou);
        state.setBecauseYouRead(becauseYouRead);
        state.setRecommendations(recommendations);
      })
      .catch((error: unknown) => {
        if (requestId !== requestSequence.current || isAbortError(error))
          return;
        state.setError(
          error instanceof Error
            ? error.message
            : "Failed to load personalization.",
        );
      })
      .finally(() => {
        if (requestId !== requestSequence.current) return;
        loadingKeys.forEach((key) => state.setLoading(key, false));
      });

    return () => controller.abort();
    // Store actions are stable; refreshKey intentionally controls reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = window.setTimeout(() => setSaveMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [saveMessage, setSaveMessage]);

  const savePreferences = useCallback(async () => {
    const current = usePersonalizationStore.getState();
    current.setLoading("saving", true);
    current.setError(null);

    try {
      const saved = await personalizationService.savePreferences(
        current.preferences,
      );
      current.setPreferences(saved);
      current.setSavedPreferences(saved);
      current.setSaveMessage("Preferences saved. Your briefing is refreshed.");
      current.setLoading("forYou", true);
      current.setLoading("recommendations", true);

      const [forYou, recommendations] = await Promise.all([
        personalizationService.getForYou(saved),
        personalizationService.getRecommendations(saved),
      ]);
      current.setForYou(forYou);
      current.setRecommendations(recommendations);
    } catch (error: unknown) {
      current.setError(
        error instanceof Error ? error.message : "Failed to save preferences.",
      );
    } finally {
      current.setLoading("saving", false);
      current.setLoading("forYou", false);
      current.setLoading("recommendations", false);
    }
  }, []);

  const retry = useCallback(() => setRefreshKey((key) => key + 1), []);

  return {
    forYou: state.forYou,
    becauseYouRead: state.becauseYouRead,
    recommendations: state.recommendations,
    readingHistory: state.readingHistory,
    topics: state.topics,
    sources: state.sources,
    preferences: state.preferences,
    savedPreferences: state.savedPreferences,
    loading: state.loading,
    error: state.error,
    saveMessage: state.saveMessage,
    toggleTopic: state.toggleTopic,
    toggleSource: state.toggleSource,
    savePreferences,
    retry,
  };
}
