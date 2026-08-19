export interface ReaderProfileMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  change: number;
}

export interface ReaderSegment {
  id: string;
  name: string;
  readers: number;
  completeness: number;
  engagementRate: number;
  primaryInterest: string;
}

export interface TopicAffinityPoint {
  topic: string;
  affinity: number;
  emerging: boolean;
  confidence: number;
}

export interface RecommendationPerformance {
  title: string;
  category: string;
  rank: number;
  ctr: number;
  confidence: number;
}

export interface FeedIntelligence {
  averageSessionMinutes: number;
  feedEngagement: number;
  contentDiversity: number;
  averageScrollDepth: number;
}

export interface PersonalizationControlSettings {
  sensitivity: number;
  diversity: number;
  personalizationLevel: number;
  topicWeighting: number;
}

export interface PersonalizationIntelligenceData {
  metrics: ReaderProfileMetric[];
  segments: ReaderSegment[];
  topicAffinity: TopicAffinityPoint[];
  recommendations: RecommendationPerformance[];
  feed: FeedIntelligence;
  mode: "demo";
  dataStatus: "complete" | "partial" | "unavailable";
}
