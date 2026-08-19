import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type {
  FactoryStory,
  IngestionStage,
  NewsroomDashboardData,
  NewsroomLoadingState,
  NewsSource,
  PackageStatus,
  PackageType,
  ReviewFilters,
  ReviewItem,
  ReviewStatus,
  SourceStatus,
  StoryPackage,
} from "@/types/newsroom";

interface NewsroomState {
  dashboard: NewsroomDashboardData | null;
  sources: NewsSource[];
  pipeline: IngestionStage[];
  sourceFilter: SourceStatus | "all";
  factoryStories: FactoryStory[];
  selectedStoryId: string | null;
  packageTypes: PackageType[];
  generatedPackage: StoryPackage | null;
  reviewItems: ReviewItem[];
  reviewFilters: ReviewFilters;
  reviewVisible: number;
  loading: NewsroomLoadingState;
  error: string | null;
  setDashboard: (dashboard: NewsroomDashboardData) => void;
  setSources: (sources: NewsSource[]) => void;
  setPipeline: (pipeline: IngestionStage[]) => void;
  setSourceFilter: (filter: SourceStatus | "all") => void;
  setFactoryStories: (stories: FactoryStory[]) => void;
  setSelectedStoryId: (id: string | null) => void;
  togglePackageType: (type: PackageType) => void;
  setGeneratedPackage: (storyPackage: StoryPackage | null) => void;
  setPackageStatus: (status: PackageStatus) => void;
  setReviewItems: (items: ReviewItem[]) => void;
  setReviewFilters: (filters: Partial<ReviewFilters>) => void;
  loadMoreReviews: () => void;
  updateReviewStatus: (id: string, status: ReviewStatus) => void;
  setLoading: (key: keyof NewsroomLoadingState, value: boolean) => void;
  setError: (error: string | null) => void;
}

const initialLoading: NewsroomLoadingState = {
  dashboard: true,
  origination: true,
  factory: true,
  review: true,
  generating: false,
};

export const useNewsroomStore = create<NewsroomState>()(
  devtools(
    (set) => ({
      dashboard: null,
      sources: [],
      pipeline: [],
      sourceFilter: "all",
      factoryStories: [],
      selectedStoryId: null,
      packageTypes: ["article"],
      generatedPackage: null,
      reviewItems: [],
      reviewFilters: {
        status: "all",
        assignee: null,
        source: null,
        search: "",
      },
      reviewVisible: 15,
      loading: { ...initialLoading },
      error: null,
      setDashboard: (dashboard) =>
        set({ dashboard }, false, "newsroom/setDashboard"),
      setSources: (sources) => set({ sources }, false, "newsroom/setSources"),
      setPipeline: (pipeline) =>
        set({ pipeline }, false, "newsroom/setPipeline"),
      setSourceFilter: (sourceFilter) =>
        set({ sourceFilter }, false, "newsroom/setSourceFilter"),
      setFactoryStories: (factoryStories) =>
        set({ factoryStories }, false, "newsroom/setFactoryStories"),
      setSelectedStoryId: (selectedStoryId) =>
        set(
          { selectedStoryId, generatedPackage: null },
          false,
          "newsroom/setSelectedStory",
        ),
      togglePackageType: (type) =>
        set(
          (state) => ({
            packageTypes: state.packageTypes.includes(type)
              ? state.packageTypes.filter((item) => item !== type)
              : [...state.packageTypes, type],
          }),
          false,
          "newsroom/togglePackageType",
        ),
      setGeneratedPackage: (generatedPackage) =>
        set({ generatedPackage }, false, "newsroom/setGeneratedPackage"),
      setPackageStatus: (status) =>
        set(
          (state) => ({
            generatedPackage: state.generatedPackage
              ? { ...state.generatedPackage, status }
              : null,
          }),
          false,
          "newsroom/setPackageStatus",
        ),
      setReviewItems: (reviewItems) =>
        set({ reviewItems }, false, "newsroom/setReviewItems"),
      setReviewFilters: (filters) =>
        set(
          (state) => ({
            reviewFilters: { ...state.reviewFilters, ...filters },
            reviewVisible: 15,
          }),
          false,
          "newsroom/setReviewFilters",
        ),
      loadMoreReviews: () =>
        set(
          (state) => ({ reviewVisible: state.reviewVisible + 15 }),
          false,
          "newsroom/loadMoreReviews",
        ),
      updateReviewStatus: (id, status) =>
        set(
          (state) => ({
            reviewItems: state.reviewItems.map((item) =>
              item.id === id ? { ...item, status } : item,
            ),
          }),
          false,
          "newsroom/updateReviewStatus",
        ),
      setLoading: (key, value) =>
        set(
          (state) => ({ loading: { ...state.loading, [key]: value } }),
          false,
          `newsroom/loading/${key}`,
        ),
      setError: (error) => set({ error }, false, "newsroom/setError"),
    }),
    {
      name: "AgbofaNewsroomStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
