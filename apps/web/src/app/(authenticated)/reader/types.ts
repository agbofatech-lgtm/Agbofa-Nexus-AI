/**
 * Agbofa Nexus AI — Reader Workspace TypeScript Definitions (P0 Batch 5)
 * Authoritative types for story feed, infinite scroll, filtering, and detail views.
 */

export type ConfidenceTier = "VERIFIED_TRUTH" | "PROVISIONAL" | "DOUBTFUL";

export type StoryStatus =
  | "DRAFT"
  | "QA_PASSED"
  | "REVIEW_REQUIRED"
  | "APPROVED"
  | "REJECTED";

export type FeedSortOption = "LATEST" | "TRENDING" | "CONFIDENCE";

export interface StoryCardData {
  packageId: string;
  storyId: string;
  title: string;
  summary: string;
  sourceName: string;
  sourcePlatform: string;
  confidenceScore: number;
  confidenceTier: ConfidenceTier;
  status: StoryStatus;
  topicCategory: string;
  publishedAt: string; // ISO 8601
  readTimeMinutes: number;
  hasMultimedia: boolean;
}

export interface StoryDetailData extends StoryCardData {
  body: string;
  authorName: string;
  verificationVerdict: string;
  evidenceSummary: string[];
  relatedStories: StoryCardData[];
  personalizationReason: string | null;
}
