export interface PredictionPoint {
  label: string;
  virality: number;
  engagement: number;
  confidence: number;
  velocity: number;
}

export interface ViralityPrediction {
  score: number;
  expectedReach: number;
  confidence: number;
  direction: "rising" | "stable" | "falling";
  status: "emerging" | "accelerating" | "peaking" | "cooling";
}

export interface EngagementPrediction {
  likes: number;
  comments: number;
  shares: number;
  ctr: number;
  engagementRate: number;
  confidence: number;
}

export interface TrendTopic {
  id: string;
  topic: string;
  category: string;
  velocity: number;
  direction: "up" | "stable" | "down";
  seasonalPattern: string;
  confidence: number;
}

export interface OptimizationRecommendation {
  id: string;
  type: "headline" | "publishing-time" | "content" | "media" | "audience";
  title: string;
  recommendation: string;
  expectedLift: number;
  confidence: number;
}

export interface PredictiveIntelligenceData {
  virality: ViralityPrediction;
  engagement: EngagementPrediction;
  trends: TrendTopic[];
  recommendations: OptimizationRecommendation[];
  series: PredictionPoint[];
  mode: "demo";
  dataStatus: "complete" | "partial" | "unavailable";
}
