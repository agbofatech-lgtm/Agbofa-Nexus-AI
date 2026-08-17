/**
 * Agbofa Nexus AI — Personalization Workspace Authoritative TypeScript Definitions (Phase 3 Batch 15 / IMP-019)
 * Defines structured types for Reader Profile & Preferences, Feed Customization, Recommendation Explanations,
 * and Behavioral Analytics & Insights across the 5 Personalization Engines (PERS-001 through PERS-005).
 */

export type InterestTier = "HIGH" | "MEDIUM" | "LOW" | "UNFOLLOWED";

export interface TopicPreferenceItem {
  id: string;
  topic: string;
  categoryName: string;
  interestScore: number; // 0.0 to 1.0 (or 0-100%)
  isFollowed: boolean;
  isExplicit: boolean;
  readCount: number;
  lastEngagedAt: string; // ISO 8601
}

export type SourceTrustTier = "HIGH_TRUST" | "VERIFIED" | "NEUTRAL" | "RESTRICTED";

export interface SourcePreferenceItem {
  id: string;
  sourceId: string;
  sourceName: string;
  platform: string; // Twitter/X, Facebook, Instagram, TikTok, LinkedIn, YouTube, Reddit, RSS, Wire Services
  preferenceScore: number; // 0.0 to 1.0 (or 0-100%)
  trustRating: SourceTrustTier;
  trustScoreDisplay: string; // e.g. "High Trust ★★★★★"
  articlesRead: number;
  isExplicitlyPreferred: boolean;
}

export type ContentFormatType = "ARTICLE" | "MULTIMEDIA" | "ALERT" | "DEEP_DIVE";

export interface ReadingHistoryItem {
  id: string;
  storyId: string;
  title: string;
  sourceName: string;
  topicCategory: string;
  format: ContentFormatType;
  timeSpentSeconds: number; // e.g. 210 = 3.5m
  readAt: string; // ISO 8601
  engagementScore: number; // 0.0 to 1.0
  completedReading: boolean;
}

export interface RecommendationExplanationItem {
  id: string;
  storyId: string;
  title: string;
  sourceName: string;
  topicCategory: string;
  relevanceScore: number; // clamped [0.0, 1.0]
  topicRelevanceScore: number; // 35% weight
  qualityScore: number; // 25% weight (AGT-024 0.92 default)
  freshnessScore: number; // 20% weight
  sourcePreferenceScore: number; // 10% weight
  diversityScore: number; // 10% weight
  explanationReason: string; // "Because you read X..." or non-fabricated default
  triggerArticleTitle?: string;
  isCollaborativeMatch: boolean;
  diversityDiscountApplied: boolean;
}

export interface EngagementMetricsData {
  dailyAvgMinutes: number;
  weeklyTotalHours: number;
  monthlyTotalHours: number;
  totalArticlesRead30d: number;
  shareRate: number; // percentage e.g. 14.2
  bookmarkRate: number; // percentage e.g. 28.5
  returnVisitRate: number; // percentage e.g. 82.1
  topicExplorationBreadth: number; // 0.0 to 1.0 e.g. 0.85
  avgEngagementScore: number; // 0.0 to 1.0 e.g. 0.84
  preferredReadingWindows: {
    windowName: string;
    utcRange: string;
    percentageOfReads: number;
  }[];
  preferredContentLengths: {
    lengthCategory: string;
    durationRange: string;
    percentageOfReads: number;
  }[];
  preferredFormats: {
    formatType: ContentFormatType;
    label: string;
    percentageOfReads: number;
  }[];
}

export interface InferredPreferenceItem {
  id: string;
  topic: string;
  categoryName: string;
  readCount: number;
  avgTimeSpentSeconds: number;
  confidenceScore: number; // 0.0 to 1.0
  suggestedAction: "ADD_TOPIC" | "BOOST_SOURCE" | "ADJUST_FORMAT";
  explanation: string;
}

export interface PersonalizationOverviewStats {
  topicsFollowedCount: number;
  sourcesPreferredCount: number;
  articlesRead30dCount: number;
  avgEngagementScore: number; // 0.0 to 1.0
  recommendationClickRate: number; // percentage e.g. 78.4
  diversityIndex: number; // 0.0 to 1.0
  inferredSuggestionsCount: number;
}
