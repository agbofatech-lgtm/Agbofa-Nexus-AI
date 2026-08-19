import type { DataConfidence, DataProvenance } from "@/types/data-state";

export const PHASE3_PLATFORMS = [
  "Facebook",
  "Instagram",
  "X",
  "YouTube",
  "TikTok",
  "LinkedIn",
  "Threads",
  "Pinterest",
  "Reddit",
  "Telegram",
  "WhatsApp",
] as const;

export type DistributionPlatform = (typeof PHASE3_PLATFORMS)[number];
export type AccountScope = "BRAND" | "PERSONAL";
export type DistributionAccountState =
  | "CONNECTED"
  | "PENDING"
  | "DEGRADED"
  | "NOT_CREATED"
  | "MANUAL"
  | "REQUIRES_AUTHORIZATION";
export type PublishingState =
  | "DRAFT"
  | "READY"
  | "REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHING"
  | "PUBLISHED"
  | "FAILED"
  | "RETRYING";
export type TruthState =
  | "OBSERVED"
  | "ESTIMATED"
  | "ATTRIBUTED"
  | "FORECAST"
  | "SIMULATED"
  | "UNAVAILABLE";
export type AttributionState = "OBSERVED" | "ESTIMATED" | "ATTRIBUTED" | "UNKNOWN";
export type AnalyticsDomain =
  | "overview"
  | "audience"
  | "content"
  | "distribution"
  | "agents"
  | "growth"
  | "revenue"
  | "attribution"
  | "forecasting"
  | "unit-economics";
export type ExperimentState =
  | "DRAFT"
  | "ACTIVE"
  | "COMPLETED"
  | "FAILED"
  | "PAUSED"
  | "ARCHIVED";

export interface DistributionAccount {
  id: string;
  platform: DistributionPlatform;
  scope: AccountScope;
  label: string;
  handle: string | null;
  state: DistributionAccountState;
  connectionReality: "NO_OAUTH" | "MANUAL_ONLY";
  stateDetail: string;
  nextStep: string;
  provenance: DataProvenance;
}

export interface PlatformAdaptationRule {
  platform: DistributionPlatform;
  voice: string;
  formats: string[];
  aspectRatios: string[];
  cta: string;
  discovery: string;
  maxLength: number | null;
  truncation: string;
  previewFidelity: "STRUCTURAL_SIMULATION";
}

export interface PublishingTransition {
  state: PublishingState;
  label: string;
  externalEffect: false;
}

export interface PublishingPlan {
  id: string;
  storyId: string;
  title: string;
  accountId: string;
  platform: DistributionPlatform;
  state: PublishingState;
  plannedFor: string | null;
  approvalOwner: string;
  failureReason: string | null;
  canRetry: boolean;
  truth: "SIMULATED";
  note: string;
}

export interface DistributionHealthRecord {
  platform: DistributionPlatform;
  accountState: DistributionAccountState;
  templateReadiness: "READY" | "PARTIAL";
  providerHealth: "UNAVAILABLE";
  issue: string;
  action: string;
}

export interface DistributionExperienceData {
  accounts: DistributionAccount[];
  platformRules: PlatformAdaptationRule[];
  publishingTransitions: PublishingTransition[];
  publishingPlans: PublishingPlan[];
  health: DistributionHealthRecord[];
  provenance: DataProvenance;
}

export interface AnalyticsMetric {
  id: string;
  domain: AnalyticsDomain;
  label: string;
  displayValue: string;
  unit: string;
  truth: TruthState;
  whatHappened: string;
  whatChanged: string;
  why: string;
  evidence: string[];
  confidence: DataConfidence;
  meaning: string;
  nextAction: string;
  provenance: DataProvenance;
}

export interface AttributionStage {
  stage: "CONTENT" | "DISTRIBUTION" | "AUDIENCE" | "CONVERSION" | "REVENUE";
  state: AttributionState;
  value: string;
  evidence: string;
  caveat: string;
}

export interface AttributionJourney {
  id: string;
  storyId: string;
  label: string;
  stages: AttributionStage[];
  causality: "NOT_ESTABLISHED";
  provenance: DataProvenance;
}

export interface ForecastRecord {
  id: string;
  horizonDays: 30 | 60 | 90;
  metric: string;
  scenario: "CONSERVATIVE" | "BASELINE" | "UPSIDE";
  range: { minimum: number; maximum: number; unit: string };
  confidence: DataConfidence;
  assumptions: string[];
  guarantee: false;
  truth: "FORECAST";
  provenance: DataProvenance;
}

export interface UnitEconomicsMetric {
  metric: "CPA" | "CPE" | "LTV" | "ROI" | "RPU";
  value: null;
  displayValue: "Unavailable";
  definition: string;
  requiredInputs: string[];
  truth: "UNAVAILABLE";
  provenance: DataProvenance;
}

export interface AnalyticsExperienceData {
  metrics: AnalyticsMetric[];
  attribution: AttributionJourney[];
  forecasts: ForecastRecord[];
  unitEconomics: UnitEconomicsMetric[];
  provenance: DataProvenance;
}

export interface ExperimentVariant {
  id: string;
  label: string;
  treatment: string;
  allocationPercent: number;
}

export interface ExperimentResult {
  controlSample: number;
  controlConversions: number;
  variantSample: number;
  variantConversions: number;
  controlRate: number;
  variantRate: number;
  relativeLift: number;
  confidenceInterval: { minimum: number; maximum: number; unit: "percentage-points" };
  pValue: number;
  significanceThreshold: 0.05;
  statisticallySignificant: boolean;
  interpretation: string;
  truth: "SIMULATED";
}

export interface ExperimentRecord {
  id: string;
  name: string;
  hypothesis: string;
  variants: ExperimentVariant[];
  audience: string;
  successMetric: string;
  state: ExperimentState;
  execution: "SIMULATED_ONLY";
  result: ExperimentResult | null;
  learning: string;
  owner: string;
  agentId: `AGT-${string}`;
  provenance: DataProvenance;
}

export interface ExperimentationExperienceData {
  experiments: ExperimentRecord[];
  lifecycle: [
    "EXPERIMENT",
    "HYPOTHESIS",
    "VARIANTS",
    "AUDIENCE",
    "SUCCESS_METRIC",
    "EXECUTION",
    "RESULT",
    "LEARNING",
  ];
  provenance: DataProvenance;
}

export interface Phase3ExperienceData {
  architectureVersion: "phase-3-experience-v1";
  canonicalAgentCount: 28;
  distribution: DistributionExperienceData;
  analytics: AnalyticsExperienceData;
  experimentation: ExperimentationExperienceData;
  provenance: DataProvenance;
}
