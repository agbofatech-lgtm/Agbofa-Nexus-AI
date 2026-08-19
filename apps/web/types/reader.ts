export const storyCategories = [
  "AI",
  "Technology",
  "Business",
  "Innovation",
  "Science",
  "Ghana",
  "Africa",
  "Global",
] as const;

export type StoryCategory = (typeof storyCategories)[number];
export type StoryVerification =
  "verified" | "in-review" | "unverified" | "pending";
export type FeedSort = "latest" | "trending" | "confidence";

export interface StoryEntities {
  people: string[];
  organizations: string[];
  locations: string[];
}

export interface Story {
  id: string;
  headline: string;
  summary: string;
  category: StoryCategory;
  source: string;
  author?: string;
  publishedAt: Date;
  readingTime: number;
  image?: string;
  verification: StoryVerification;
  confidence: number;
  trendScore: number;
  entities?: StoryEntities;
}

export interface FeedFilters {
  topic: StoryCategory | null;
  source: string | null;
}

export interface FeedOptions {
  sort: FeedSort;
  filters: FeedFilters;
  search: string;
  cursor: string | null;
  limit?: number;
  signal?: AbortSignal;
}

export interface FeedResponse {
  stories: Story[];
  featured: Story | null;
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}
