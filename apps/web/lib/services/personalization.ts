import {
  defaultReaderPreferences,
  mockPersonalizationSources,
  mockPersonalizationTopics,
  mockReadingHistory,
} from "@/lib/mocks/personalization";
import { mockStories } from "@/lib/mocks/stories";
import type {
  BecauseYouReadData,
  PersonalizedStory,
  PersonalizationSource,
  PersonalizationTopic,
  ReaderPreferencesData,
  ReadingHistoryEntry,
} from "@/types/personalization";
import type { Story } from "@/types/reader";

const PREFERENCES_KEY = "agbofa-nexus-reader-preferences";
const REFERENCE_TIME = Date.parse("2026-08-16T19:30:00Z");

function delay(duration: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Request aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(resolve, duration);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Request aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function sanitizePreferences(value: unknown): ReaderPreferencesData {
  if (!value || typeof value !== "object") return defaultReaderPreferences;
  const candidate = value as Partial<ReaderPreferencesData>;
  return {
    topics: Array.isArray(candidate.topics)
      ? candidate.topics.filter(
          (topic): topic is string => typeof topic === "string",
        )
      : [...defaultReaderPreferences.topics],
    sources: Array.isArray(candidate.sources)
      ? candidate.sources.filter(
          (source): source is string => typeof source === "string",
        )
      : [...defaultReaderPreferences.sources],
  };
}

function recommendationReason(
  story: Story,
  preferences: ReaderPreferencesData,
): string {
  if (preferences.topics.includes(story.category)) {
    return `Matches your interest in ${story.category}`;
  }
  if (preferences.sources.includes(story.source)) {
    return `From a source you follow: ${story.source}`;
  }
  if (story.confidence >= 92) {
    return "High-confidence intelligence selected for you";
  }
  return "Expands the range of your current briefing";
}

function scoreStory(
  story: Story,
  preferences: ReaderPreferencesData,
  offset = 0,
): number {
  return (
    (preferences.topics.includes(story.category) ? 50 : 0) +
    (preferences.sources.includes(story.source) ? 34 : 0) +
    story.trendScore * 0.12 +
    story.confidence * 0.08 -
    offset * 0.001
  );
}

function personalizedStories(
  preferences: ReaderPreferencesData,
  limit: number,
  offset = 0,
): PersonalizedStory[] {
  return mockStories
    .map((story, index) => ({
      story,
      reason: recommendationReason(story, preferences),
      score: scoreStory(story, preferences, index),
    }))
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.story.id.localeCompare(second.story.id),
    )
    .slice(offset, offset + limit);
}

function sharesEntity(first: Story, second: Story): boolean {
  const firstEntities = new Set([
    ...(first.entities?.people ?? []),
    ...(first.entities?.organizations ?? []),
    ...(first.entities?.locations ?? []),
  ]);
  return [
    ...(second.entities?.people ?? []),
    ...(second.entities?.organizations ?? []),
    ...(second.entities?.locations ?? []),
  ].some((entity) => firstEntities.has(entity));
}

export const personalizationService = {
  async getTopics(signal?: AbortSignal): Promise<PersonalizationTopic[]> {
    await delay(140, signal);
    return [...mockPersonalizationTopics];
  },

  async getSources(signal?: AbortSignal): Promise<PersonalizationSource[]> {
    await delay(170, signal);
    return [...mockPersonalizationSources];
  },

  async getPreferences(signal?: AbortSignal): Promise<ReaderPreferencesData> {
    await delay(120, signal);
    try {
      const stored = window.localStorage.getItem(PREFERENCES_KEY);
      return stored
        ? sanitizePreferences(JSON.parse(stored) as unknown)
        : {
            topics: [...defaultReaderPreferences.topics],
            sources: [...defaultReaderPreferences.sources],
          };
    } catch {
      return {
        topics: [...defaultReaderPreferences.topics],
        sources: [...defaultReaderPreferences.sources],
      };
    }
  },

  async getForYou(
    preferences: ReaderPreferencesData,
    signal?: AbortSignal,
  ): Promise<PersonalizedStory[]> {
    await delay(480, signal);
    return personalizedStories(preferences, 6);
  },

  async getBecauseYouRead(
    storyId: string,
    signal?: AbortSignal,
  ): Promise<BecauseYouReadData> {
    await delay(390, signal);
    const sourceStory = mockStories.find((story) => story.id === storyId);
    if (!sourceStory) return { story: null, recommendations: [] };

    const recommendations = mockStories
      .filter((story) => story.id !== sourceStory.id)
      .filter(
        (story) =>
          story.category === sourceStory.category ||
          sharesEntity(sourceStory, story),
      )
      .map((story, index) => ({
        story,
        reason:
          story.category === sourceStory.category
            ? `Continues your ${sourceStory.category} reading path`
            : "Connected through people, organizations, or locations",
        score: story.trendScore + story.confidence / 10 - index * 0.001,
      }))
      .sort((first, second) => second.score - first.score)
      .slice(0, 4);

    return { story: sourceStory, recommendations };
  },

  async getRecommendations(
    preferences: ReaderPreferencesData,
    signal?: AbortSignal,
  ): Promise<PersonalizedStory[]> {
    await delay(330, signal);
    return personalizedStories(preferences, 4, 6);
  },

  async getReadingHistory(
    signal?: AbortSignal,
  ): Promise<ReadingHistoryEntry[]> {
    await delay(230, signal);
    return mockReadingHistory.flatMap((entry) => {
      const story = mockStories.find(
        (candidate) => candidate.id === entry.storyId,
      );
      return story
        ? [
            {
              story,
              progress: entry.progress,
              lastReadAt: new Date(REFERENCE_TIME - entry.minutesAgo * 60_000),
            },
          ]
        : [];
    });
  },

  async savePreferences(
    preferences: ReaderPreferencesData,
    signal?: AbortSignal,
  ): Promise<ReaderPreferencesData> {
    await delay(520, signal);
    const sanitized = sanitizePreferences(preferences);
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(sanitized));
    return sanitized;
  },
};
