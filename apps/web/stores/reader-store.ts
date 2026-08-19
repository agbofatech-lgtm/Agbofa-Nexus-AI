import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type { FeedFilters, FeedSort, Story } from "@/types/reader";

interface ReaderState {
  stories: Story[];
  featuredStory: Story | null;
  cursor: string | null;
  hasMore: boolean;
  total: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  sort: FeedSort;
  filters: FeedFilters;
  searchQuery: string;
  setStories: (stories: Story[]) => void;
  addStories: (stories: Story[]) => void;
  setFeaturedStory: (story: Story | null) => void;
  setCursor: (cursor: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  setTotal: (total: number) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loadingMore: boolean) => void;
  setError: (error: string | null) => void;
  setSort: (sort: FeedSort) => void;
  setFilters: (filters: Partial<FeedFilters>) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  reset: () => void;
}

const initialReaderState = {
  stories: [] as Story[],
  featuredStory: null as Story | null,
  cursor: null as string | null,
  hasMore: true,
  total: 0,
  loading: true,
  loadingMore: false,
  error: null as string | null,
  sort: "latest" as FeedSort,
  filters: { topic: null, source: null } as FeedFilters,
  searchQuery: "",
};

export const useReaderStore = create<ReaderState>()(
  devtools(
    (set) => ({
      ...initialReaderState,
      setStories: (stories) => set({ stories }, false, "reader/setStories"),
      addStories: (incoming) =>
        set(
          (state) => {
            const existingIds = new Set(state.stories.map((story) => story.id));
            return {
              stories: [
                ...state.stories,
                ...incoming.filter((story) => !existingIds.has(story.id)),
              ],
            };
          },
          false,
          "reader/addStories",
        ),
      setFeaturedStory: (featuredStory) =>
        set({ featuredStory }, false, "reader/setFeaturedStory"),
      setCursor: (cursor) => set({ cursor }, false, "reader/setCursor"),
      setHasMore: (hasMore) => set({ hasMore }, false, "reader/setHasMore"),
      setTotal: (total) => set({ total }, false, "reader/setTotal"),
      setLoading: (loading) => set({ loading }, false, "reader/setLoading"),
      setLoadingMore: (loadingMore) =>
        set({ loadingMore }, false, "reader/setLoadingMore"),
      setError: (error) => set({ error }, false, "reader/setError"),
      setSort: (sort) => set({ sort }, false, "reader/setSort"),
      setFilters: (filters) =>
        set(
          (state) => ({ filters: { ...state.filters, ...filters } }),
          false,
          "reader/setFilters",
        ),
      setSearchQuery: (searchQuery) =>
        set({ searchQuery }, false, "reader/setSearchQuery"),
      clearFilters: () =>
        set(
          { filters: { topic: null, source: null }, searchQuery: "" },
          false,
          "reader/clearFilters",
        ),
      reset: () => set({ ...initialReaderState }, false, "reader/reset"),
    }),
    {
      name: "AgbofaReaderStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
