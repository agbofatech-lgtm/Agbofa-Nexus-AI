import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type { StoryDetail } from "@/types/story";

interface StoryState {
  story: StoryDetail | null;
  relatedStories: StoryDetail[];
  loading: boolean;
  error: string | null;
  notFound: boolean;
  setStory: (story: StoryDetail | null) => void;
  setRelatedStories: (stories: StoryDetail[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNotFound: (notFound: boolean) => void;
  reset: () => void;
}

const initialStoryState = {
  story: null as StoryDetail | null,
  relatedStories: [] as StoryDetail[],
  loading: true,
  error: null as string | null,
  notFound: false,
};

export const useStoryStore = create<StoryState>()(
  devtools(
    (set) => ({
      ...initialStoryState,
      setStory: (story) => set({ story }, false, "story/setStory"),
      setRelatedStories: (relatedStories) =>
        set({ relatedStories }, false, "story/setRelatedStories"),
      setLoading: (loading) => set({ loading }, false, "story/setLoading"),
      setError: (error) => set({ error }, false, "story/setError"),
      setNotFound: (notFound) => set({ notFound }, false, "story/setNotFound"),
      reset: () => set({ ...initialStoryState }, false, "story/reset"),
    }),
    {
      name: "AgbofaStoryStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
