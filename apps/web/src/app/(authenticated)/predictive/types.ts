/**
 * Agbofa Nexus AI — Predictive Intelligence Workspace Authoritative TypeScript Definitions (P0 Batch 14 / IMP-018)
 * Defines types for the 6 prediction engines (PRED-001 through PRED-006), time-series forecasts,
 * anomaly detection, content performance optimization, trend lifecycle, and model management ledgers.
 */

export type ViralityTierType = "VIRAL" | "HIGH_POTENTIAL" | "NORMAL";

export interface ViralityPredictionItem {
  id: string;
  storyId: string;
  title: string;
  score: number; // 0.0 to 1.0
  confidence: number; // 0.0 to 1.0
  tier: ViralityTierType;
  predictedPeakTime: string; // ISO 8601
  estimatedReach: number;
  isFallbackTriggered: boolean; // when confidence < 0.70 (ViralityModelFallbackThreshold)
  modelVersion: string;
  evaluatedAt: string; // ISO 8601
}

export interface EngagementForecastItem {
  id: string;
  storyId: string;
  title: string;
  predictedRate: number; // percentage e.g. 8.4
  actualRate?: number;
  accuracyScore: number; // e.g. 0.941
  audienceSegment: string;
  isColdStart: boolean;
  timestamp: string; // ISO 8601
}

export interface ForecastSeriesPoint {
  time: string; // e.g. "00:00", "04:00"
  predicted: number;
  actual?: number;
  upperBound: number;
  lowerBound: number;
}

export type OptimizationSuggestionType =
  | "HEADLINE"
  | "MEDIA"
  | "KEYWORDS"
  | "LENGTH";

export interface OptimizationSuggestionItem {
  id: string;
  storyId: string;
  title: string;
  type: OptimizationSuggestionType;
  suggestionText: string;
  expectedLiftPct: number; // e.g. 18
  currentScore: number;
  projectedScore: number;
}

export type TrendLifecyclePhaseType =
  | "EMERGING"
  | "ACCELERATING"
  | "PEAK"
  | "DECAY"
  | "EVERGREEN";

export interface TrendPredictionItem {
  id: string;
  topic: string;
  currentPhase: TrendLifecyclePhaseType;
  predictedPeakTime: string; // ISO 8601 or relative
  velocity: number; // signals/hour
  historicalPatternMatchPct: number; // e.g. 95.4
  confidence: number;
  timestamp: string;
}

export type AnomalyType = "SPIKE" | "DROP" | "DIVERGENCE" | "EMERGENCE";
export type AnomalySeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface AnomalyAlertItem {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  affectedMetric: string;
  baselineValue: number;
  currentValue: number;
  deviationPct: number;
  consecutiveConfirmations: number; // requires 2+ consecutive confirmations
  isSuppressed: boolean;
  breakingNewsCorrelation?: string; // AGT-009 correlation note
  detectedAt: string; // ISO 8601
}

export interface PublishingTimeItem {
  platform:
    | "Twitter/X"
    | "LinkedIn"
    | "Facebook"
    | "Instagram"
    | "YouTube"
    | "Reddit"
    | "RSS";
  optimalDay: string;
  optimalHourUtc: string;
  predictedEngagementRate: number;
  breakingOverrideCount: number;
  embargoScheduledCount: number;
}

export interface HourlyEngagementPoint {
  hour: string; // "00:00" to "23:00"
  engagementScore: number; // 0 to 100
  isOptimalWindow: boolean;
}

export type PredictiveModelStatus = "ACTIVE" | "CANDIDATE" | "RETIRED" | "TRAINING";

export interface PredictiveModelItem {
  id: string;
  name: string;
  engineCode: "PRED-001" | "PRED-002" | "PRED-003" | "PRED-004" | "PRED-005" | "PRED-006";
  version: string;
  status: PredictiveModelStatus;
  accuracyScore: number; // e.g. 0.962
  accuracyTrendPct: number; // e.g. 1.4
  dataPointsUsed: number;
  minDataRequirementMet: boolean; // dataPointsUsed >= 100
  lastTrainedAt: string; // ISO 8601
}

export interface PredictiveOverviewStats {
  activePredictionsToday: number;
  avgModelAccuracy: number; // 0.0 to 1.0
  viralPredictionsCount: number;
  viralPercentage: number;
  activeAnomaliesCount: number;
  criticalAnomaliesCount: number;
}
