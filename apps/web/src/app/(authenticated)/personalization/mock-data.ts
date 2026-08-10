import {
  TopicPreferenceItem,
  SourcePreferenceItem,
  ReadingHistoryItem,
  RecommendationExplanationItem,
  EngagementMetricsData,
  InferredPreferenceItem,
  PersonalizationOverviewStats,
} from "./types";

export const INITIAL_OVERVIEW_STATS: PersonalizationOverviewStats = {
  topicsFollowedCount: 8,
  sourcesPreferredCount: 9,
  articlesRead30dCount: 142,
  avgEngagementScore: 0.84,
  recommendationClickRate: 78.4,
  diversityIndex: 0.85,
  inferredSuggestionsCount: 2,
};

export const SAMPLE_TOPIC_PREFERENCES: TopicPreferenceItem[] = [
  {
    id: "top-001",
    topic: "BREAKING",
    categoryName: "Breaking News & Rapid Alerts",
    interestScore: 0.95,
    isFollowed: true,
    isExplicit: true,
    readCount: 42,
    lastEngagedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "top-002",
    topic: "TECHNOLOGY",
    categoryName: "Artificial Intelligence & Software",
    interestScore: 0.92,
    isFollowed: true,
    isExplicit: true,
    readCount: 38,
    lastEngagedAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "top-003",
    topic: "POLITICS",
    categoryName: "Global Policy & Elections",
    interestScore: 0.78,
    isFollowed: true,
    isExplicit: true,
    readCount: 24,
    lastEngagedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: "top-004",
    topic: "BUSINESS",
    categoryName: "Markets, Media & Venture Capital",
    interestScore: 0.82,
    isFollowed: true,
    isExplicit: false, // Inferred
    readCount: 19,
    lastEngagedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "top-005",
    topic: "SCIENCE",
    categoryName: "Research, Space & Physics",
    interestScore: 0.65,
    isFollowed: true,
    isExplicit: false,
    readCount: 11,
    lastEngagedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: "top-006",
    topic: "HEALTH",
    categoryName: "BioTech & Public Health",
    interestScore: 0.55,
    isFollowed: true,
    isExplicit: true,
    readCount: 5,
    lastEngagedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "top-007",
    topic: "SPORTS",
    categoryName: "Global Athletics & Leagues",
    interestScore: 0.30,
    isFollowed: false,
    isExplicit: false,
    readCount: 2,
    lastEngagedAt: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
  {
    id: "top-008",
    topic: "ENTERTAINMENT",
    categoryName: "Culture, Film & Streaming",
    interestScore: 0.25,
    isFollowed: false,
    isExplicit: false,
    readCount: 1,
    lastEngagedAt: new Date(Date.now() - 96 * 3600000).toISOString(),
  },
];

export const SAMPLE_SOURCE_PREFERENCES: SourcePreferenceItem[] = [
  {
    id: "src-001",
    sourceId: "wire-reuters-ap",
    sourceName: "Global Wire Services (Reuters/AP)",
    platform: "Wire Services",
    preferenceScore: 0.95,
    trustRating: "HIGH_TRUST",
    trustScoreDisplay: "High Trust ★★★★★",
    articlesRead: 54,
    isExplicitlyPreferred: true,
  },
  {
    id: "src-002",
    sourceId: "social-twitter-x",
    sourceName: "Official Breaking Desks on X",
    platform: "Twitter/X",
    preferenceScore: 0.88,
    trustRating: "VERIFIED",
    trustScoreDisplay: "Verified ★★★★☆",
    articlesRead: 32,
    isExplicitlyPreferred: true,
  },
  {
    id: "src-003",
    sourceId: "social-linkedin",
    sourceName: "Industry Leaders & Policy Posts",
    platform: "LinkedIn",
    preferenceScore: 0.75,
    trustRating: "VERIFIED",
    trustScoreDisplay: "Verified ★★★★☆",
    articlesRead: 18,
    isExplicitlyPreferred: false,
  },
  {
    id: "src-004",
    sourceId: "rss-tech-journals",
    sourceName: "Verified RSS Tech & Science Journals",
    platform: "RSS",
    preferenceScore: 0.90,
    trustRating: "HIGH_TRUST",
    trustScoreDisplay: "High Trust ★★★★★",
    articlesRead: 21,
    isExplicitlyPreferred: true,
  },
  {
    id: "src-005",
    sourceId: "video-youtube",
    sourceName: "Verified Broadcast Explainer Channels",
    platform: "YouTube",
    preferenceScore: 0.60,
    trustRating: "NEUTRAL",
    trustScoreDisplay: "Neutral ★★★☆☆",
    articlesRead: 9,
    isExplicitlyPreferred: false,
  },
  {
    id: "src-006",
    sourceId: "social-reddit",
    sourceName: "Curated Community Discourses",
    platform: "Reddit",
    preferenceScore: 0.50,
    trustRating: "NEUTRAL",
    trustScoreDisplay: "Neutral ★★★☆☆",
    articlesRead: 5,
    isExplicitlyPreferred: false,
  },
  {
    id: "src-007",
    sourceId: "social-facebook",
    sourceName: "Public Page Broadcasts",
    platform: "Facebook",
    preferenceScore: 0.35,
    trustRating: "RESTRICTED",
    trustScoreDisplay: "Restricted ★★☆☆☆",
    articlesRead: 2,
    isExplicitlyPreferred: false,
  },
  {
    id: "src-008",
    sourceId: "social-instagram",
    sourceName: "Verified Visual Feature Desks",
    platform: "Instagram",
    preferenceScore: 0.40,
    trustRating: "NEUTRAL",
    trustScoreDisplay: "Neutral ★★★☆☆",
    articlesRead: 1,
    isExplicitlyPreferred: false,
  },
  {
    id: "src-009",
    sourceId: "social-tiktok",
    sourceName: "Short-Form Briefing Clips",
    platform: "TikTok",
    preferenceScore: 0.30,
    trustRating: "RESTRICTED",
    trustScoreDisplay: "Restricted ★★☆☆☆",
    articlesRead: 0,
    isExplicitlyPreferred: false,
  },
];

export const SAMPLE_READING_HISTORY: ReadingHistoryItem[] = [
  {
    id: "hist-001",
    storyId: "story-101",
    title: "Autonomous AI Newsroom Workforce Expands Across Regions",
    sourceName: "Global Wire Services (Reuters/AP)",
    topicCategory: "TECHNOLOGY",
    format: "ARTICLE",
    timeSpentSeconds: 240, // 4.0m
    readAt: new Date(Date.now() - 35 * 60000).toISOString(),
    engagementScore: 0.94,
    completedReading: true,
  },
  {
    id: "hist-002",
    storyId: "story-102",
    title: "Predictive Intelligence Engines Scale MAPE Calibration",
    sourceName: "Verified RSS Tech & Science Journals",
    topicCategory: "TECHNOLOGY",
    format: "DEEP_DIVE",
    timeSpentSeconds: 380, // 6.3m
    readAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    engagementScore: 0.91,
    completedReading: true,
  },
  {
    id: "hist-003",
    storyId: "story-103",
    title: "Row-Level Security Enforces Strict Tenant Boundaries in Postgres",
    sourceName: "Official Breaking Desks on X",
    topicCategory: "BUSINESS",
    format: "ARTICLE",
    timeSpentSeconds: 195, // 3.25m
    readAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    engagementScore: 0.82,
    completedReading: true,
  },
  {
    id: "hist-004",
    storyId: "story-104",
    title: "Global Central Banks Coordinate Policy Response to Digital Currencies",
    sourceName: "Global Wire Services (Reuters/AP)",
    topicCategory: "BUSINESS",
    format: "ARTICLE",
    timeSpentSeconds: 120, // 2.0m
    readAt: new Date(Date.now() - 14 * 3600000).toISOString(),
    engagementScore: 0.65,
    completedReading: false,
  },
  {
    id: "hist-005",
    storyId: "story-105",
    title: "Breakthrough Fusion Energy Experiment Confirms Sustained Output",
    sourceName: "Verified RSS Tech & Science Journals",
    topicCategory: "SCIENCE",
    format: "MULTIMEDIA",
    timeSpentSeconds: 310, // 5.2m
    readAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    engagementScore: 0.88,
    completedReading: true,
  },
];

export const SAMPLE_RECOMMENDATIONS: RecommendationExplanationItem[] = [
  {
    id: "rec-001",
    storyId: "story-201",
    title: "Multi-Agent Newsrooms Achieve Zero-Fabrication Editorial Independence",
    sourceName: "Global Wire Services (Reuters/AP)",
    topicCategory: "TECHNOLOGY",
    relevanceScore: 0.93,
    topicRelevanceScore: 0.96, // * 0.35 = 0.336
    qualityScore: 0.92, // * 0.25 = 0.230 (AGT-024)
    freshnessScore: 0.95, // * 0.20 = 0.190
    sourcePreferenceScore: 0.95, // * 0.10 = 0.095
    diversityScore: 0.80, // * 0.10 = 0.080
    explanationReason:
      "Because you read 'Autonomous AI Newsroom Workforce Expands Across Regions' — collaborative and topic relevance match",
    triggerArticleTitle:
      "Autonomous AI Newsroom Workforce Expands Across Regions",
    isCollaborativeMatch: true,
    diversityDiscountApplied: false,
  },
  {
    id: "rec-002",
    storyId: "story-202",
    title: "Empirical Virality Forecasting Calibrates Three-Tier MAPE Horizons",
    sourceName: "Verified RSS Tech & Science Journals",
    topicCategory: "TECHNOLOGY",
    relevanceScore: 0.88,
    topicRelevanceScore: 0.92,
    qualityScore: 0.92,
    freshnessScore: 0.88,
    sourcePreferenceScore: 0.90,
    diversityScore: 0.75,
    explanationReason:
      "Because you read 'Predictive Intelligence Engines Scale MAPE Calibration' — collaborative and topic relevance match",
    triggerArticleTitle:
      "Predictive Intelligence Engines Scale MAPE Calibration",
    isCollaborativeMatch: true,
    diversityDiscountApplied: false,
  },
  {
    id: "rec-003",
    storyId: "story-203",
    title: "Row-Level Tenant Policies Extend to Distributed Analytics Caches",
    sourceName: "Official Breaking Desks on X",
    topicCategory: "BUSINESS",
    relevanceScore: 0.64, // Discounted due to anti-echo-chamber diversity
    topicRelevanceScore: 0.85,
    qualityScore: 0.92,
    freshnessScore: 0.80,
    sourcePreferenceScore: 0.88,
    diversityScore: 0.60,
    explanationReason:
      "Because you read 'Row-Level Security Enforces Strict Tenant Boundaries in Postgres' — collaborative and topic relevance match",
    triggerArticleTitle:
      "Row-Level Security Enforces Strict Tenant Boundaries in Postgres",
    isCollaborativeMatch: true,
    diversityDiscountApplied: true, // 0.75x anti-echo-chamber discount applied
  },
  {
    id: "rec-004",
    storyId: "story-204",
    title: "Global Supply Chain Rebalancing Drives New Venture Funding Inflow",
    sourceName: "Global Wire Services (Reuters/AP)",
    topicCategory: "BUSINESS",
    relevanceScore: 0.79,
    topicRelevanceScore: 0.78,
    qualityScore: 0.92,
    freshnessScore: 0.85,
    sourcePreferenceScore: 0.95,
    diversityScore: 0.90,
    explanationReason:
      "Personalized recommendation from reading history preferences", // No trigger article -> Zero Fabrication Guarantee
    triggerArticleTitle: undefined,
    isCollaborativeMatch: false,
    diversityDiscountApplied: false,
  },
];

export const SAMPLE_ENGAGEMENT_METRICS: EngagementMetricsData = {
  dailyAvgMinutes: 45,
  weeklyTotalHours: 5.2,
  monthlyTotalHours: 22.4,
  totalArticlesRead30d: 142,
  shareRate: 14.2,
  bookmarkRate: 28.5,
  returnVisitRate: 82.1,
  topicExplorationBreadth: 0.85,
  avgEngagementScore: 0.84,
  preferredReadingWindows: [
    {
      windowName: "Morning Peak (06:00–09:00 UTC)",
      utcRange: "06:00 – 09:00 UTC",
      percentageOfReads: 44,
    },
    {
      windowName: "Evening Digest (18:00–21:00 UTC)",
      utcRange: "18:00 – 21:00 UTC",
      percentageOfReads: 36,
    },
    {
      windowName: "Midday Alerts (12:00–14:00 UTC)",
      utcRange: "12:00 – 14:00 UTC",
      percentageOfReads: 20,
    },
  ],
  preferredContentLengths: [
    {
      lengthCategory: "Long-Form Analysis (5–8 minutes)",
      durationRange: "300s – 480s",
      percentageOfReads: 64,
    },
    {
      lengthCategory: "Executive Summary (2–4 minutes)",
      durationRange: "120s – 240s",
      percentageOfReads: 26,
    },
    {
      lengthCategory: "Rapid Flash Alert (<1 minute)",
      durationRange: "0s – 60s",
      percentageOfReads: 10,
    },
  ],
  preferredFormats: [
    {
      formatType: "ARTICLE",
      label: "Deep-Dive Verified Articles",
      percentageOfReads: 72,
    },
    {
      formatType: "ALERT",
      label: "Breaking Wire Flash Alerts",
      percentageOfReads: 18,
    },
    {
      formatType: "MULTIMEDIA",
      label: "Interactive Multimedia & Data Charts",
      percentageOfReads: 10,
    },
  ],
};

export const SAMPLE_INFERRED_PREFERENCES: InferredPreferenceItem[] = [
  {
    id: "inf-001",
    topic: "ARTIFICIAL_INTELLIGENCE",
    categoryName: "Artificial Intelligence & Neural Architectures",
    readCount: 18,
    avgTimeSpentSeconds: 275, // 4.6m
    confidenceScore: 0.94,
    suggestedAction: "ADD_TOPIC",
    explanation:
      "You have read 18 articles tagged #AI in the last 14 days with an average completion rate of 96%. Add explicit preference to prioritize AI deep dives?",
  },
  {
    id: "inf-002",
    topic: "CYBERSECURITY",
    categoryName: "Cybersecurity & Zero-Trust Infrastructure",
    readCount: 11,
    avgTimeSpentSeconds: 210, // 3.5m
    confidenceScore: 0.87,
    suggestedAction: "ADD_TOPIC",
    explanation:
      "You frequently engage with cybersecurity breach analysis and zero-trust policy articles. Would you like to add an explicit topic weighting?",
  },
];
