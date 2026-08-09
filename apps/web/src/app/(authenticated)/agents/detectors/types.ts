/**
 * Agbofa Nexus AI — Content Detector Agent Dashboards Authoritative TypeScript Definitions (P0 Batch 11)
 * Defines types for the 8 detector agents (AGT-009 through AGT-016) and their specialized intelligence visualizations.
 */

export type DetectorHealthStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "RATE_LIMITED"
  | "AUTH_FAILED"
  | "OFFLINE";

export interface DetectorAgentItem {
  agentId: string; // "AGT-009" to "AGT-016"
  name: string;
  squad: "DETECTORS";
  status: DetectorHealthStatus;
  version: string;
  uptime: number;
  detections24h: number;
  avgConfidence: number; // e.g. 0.94
  avgLatencyMs: number; // e.g. 115
  primaryMetricLabel: string;
  primaryMetricValue: string | number;
  lastCheckedAt: string; // ISO 8601
}

export interface DetectionResultItem {
  id: string;
  agentId: string;
  detectedAt: string; // ISO 8601
  title: string;
  contentPreview: string;
  typeBadge: string; // e.g. "C1 BREAKING", "EMERGING TREND", "POSITIVE", "HIGH CREDIBILITY"
  confidenceScore: number; // 0.0 to 1.0
  priority?: "C1" | "C2" | "C3";
  metadata?: Record<string, string | number>;
}

export type TrendStage =
  | "EMERGING"
  | "ACCELERATING"
  | "PEAK"
  | "DECAY"
  | "EVERGREEN";

export interface TrendStageCount {
  stage: TrendStage;
  count: number;
  velocity: number; // signals/hr
}

export interface TrendVelocityPoint {
  hour: string;
  velocity: number;
}

export interface SentimentDistribution {
  positive: number; // count
  negative: number;
  neutral: number;
  mixed: number;
}

export type CredibilityTier = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export interface CredibilityScoreData {
  avgScore: number; // 0.0 to 1.0
  tier: CredibilityTier;
  distribution: {
    high: number;
    medium: number;
    low: number;
    unknown: number;
  };
}

export interface ViralityDistribution {
  viral: number; // >0.8
  highPotential: number; // 0.5-0.8
  normal: number; // <0.5
}

export interface ViralityPredictionItem {
  id: string;
  title: string;
  predictedScore: number; // 0.0 to 1.0
  actualOutcome: "VIRAL" | "HIGH_POTENTIAL" | "NORMAL" | "PENDING";
  evaluatedAt: string;
}

export interface PriorityBreakdown {
  c1Count: number; // >5 sources
  c2Count: number; // 3-5 sources
  c3Count: number; // <3 sources
}

export interface MediaTypeBreakdown {
  text: number;
  image: number;
  video: number;
  audio: number;
  mixed: number;
}

export interface LanguageDistributionItem {
  language: string;
  locale: string;
  count: number;
  percentage: number;
}

export interface DuplicateRatioData {
  original: number;
  duplicate: number;
  derivative: number;
  translated: number;
}
