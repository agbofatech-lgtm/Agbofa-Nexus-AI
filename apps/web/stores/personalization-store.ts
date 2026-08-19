import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type {
  BecauseYouReadData,
  PersonalizedStory,
  PersonalizationLoadingState,
  PersonalizationSource,
  PersonalizationTopic,
  ReaderPreferencesData,
  ReadingHistoryEntry,
} from "@/types/personalization";

interface PersonalizationState {
  forYou: PersonalizedStory[];
  becauseYouRead: BecauseYouReadData;
  recommendations: PersonalizedStory[];
  readingHistory: ReadingHistoryEntry[];
  topics: PersonalizationTopic[];
  sources: PersonalizationSource[];
  preferences: ReaderPreferencesData;
  savedPreferences: ReaderPreferencesData;
  loading: PersonalizationLoadingState;
  error: string | null;
  saveMessage: string | null;
  setForYou: (stories: PersonalizedStory[]) => void;
  setBecauseYouRead: (data: BecauseYouReadData) => void;
  setRecommendations: (stories: PersonalizedStory[]) => void;
  setReadingHistory: (history: ReadingHistoryEntry[]) => void;
  setTopics: (topics: PersonalizationTopic[]) => void;
  setSources: (sources: PersonalizationSource[]) => void;
  setPreferences: (preferences: ReaderPreferencesData) => void;
  setSavedPreferences: (preferences: ReaderPreferencesData) => void;
  toggleTopic: (topicId: string) => void;
  toggleSource: (sourceId: string) => void;
  setLoading: (key: keyof PersonalizationLoadingState, value: boolean) => void;
  setError: (error: string | null) => void;
  setSaveMessage: (message: string | null) => void;
  reset: () => void;
}

const emptyPreferences: ReaderPreferencesData = { topics: [], sources: [] };
const initialLoading: PersonalizationLoadingState = {
  catalog: true,
  forYou: true,
  becauseYouRead: true,
  recommendations: true,
  history: true,
  saving: false,
};

const initialState = {
  forYou: [] as PersonalizedStory[],
  becauseYouRead: {
    story: null,
    recommendations: [],
  } as BecauseYouReadData,
  recommendations: [] as PersonalizedStory[],
  readingHistory: [] as ReadingHistoryEntry[],
  topics: [] as PersonalizationTopic[],
  sources: [] as PersonalizationSource[],
  preferences: { ...emptyPreferences },
  savedPreferences: { ...emptyPreferences },
  loading: { ...initialLoading },
  error: null as string | null,
  saveMessage: null as string | null,
};

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

export const usePersonalizationStore = create<PersonalizationState>()(
  devtools(
    (set) => ({
      ...initialState,
      setForYou: (forYou) =>
        set({ forYou }, false, "personalization/setForYou"),
      setBecauseYouRead: (becauseYouRead) =>
        set({ becauseYouRead }, false, "personalization/setBecauseYouRead"),
      setRecommendations: (recommendations) =>
        set({ recommendations }, false, "personalization/setRecommendations"),
      setReadingHistory: (readingHistory) =>
        set({ readingHistory }, false, "personalization/setReadingHistory"),
      setTopics: (topics) =>
        set({ topics }, false, "personalization/setTopics"),
      setSources: (sources) =>
        set({ sources }, false, "personalization/setSources"),
      setPreferences: (preferences) =>
        set(
          {
            preferences: {
              topics: [...preferences.topics],
              sources: [...preferences.sources],
            },
          },
          false,
          "personalization/setPreferences",
        ),
      setSavedPreferences: (savedPreferences) =>
        set(
          {
            savedPreferences: {
              topics: [...savedPreferences.topics],
              sources: [...savedPreferences.sources],
            },
          },
          false,
          "personalization/setSavedPreferences",
        ),
      toggleTopic: (topicId) =>
        set(
          (state) => ({
            preferences: {
              ...state.preferences,
              topics: toggleValue(state.preferences.topics, topicId),
            },
          }),
          false,
          "personalization/toggleTopic",
        ),
      toggleSource: (sourceId) =>
        set(
          (state) => ({
            preferences: {
              ...state.preferences,
              sources: toggleValue(state.preferences.sources, sourceId),
            },
          }),
          false,
          "personalization/toggleSource",
        ),
      setLoading: (key, value) =>
        set(
          (state) => ({ loading: { ...state.loading, [key]: value } }),
          false,
          `personalization/loading/${key}`,
        ),
      setError: (error) => set({ error }, false, "personalization/setError"),
      setSaveMessage: (saveMessage) =>
        set({ saveMessage }, false, "personalization/setSaveMessage"),
      reset: () => set({ ...initialState }, false, "personalization/reset"),
    }),
    {
      name: "AgbofaPersonalizationStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
