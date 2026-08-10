/**
 * Agbofa Nexus AI — Verification Agent Dashboards Authoritative TypeScript Definitions (P0 Batch 12)
 * Defines types for the 8 verification agents (AGT-017 through AGT-024) and their specialized integrity visualizations.
 */

export type VerificationHealthStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "RATE_LIMITED"
  | "AUTH_FAILED"
  | "OFFLINE";

export interface VerificationAgentItem {
  agentId: string; // "AGT-017" to "AGT-024"
  name: string;
  type: string;
  squad: "VERIFICATION";
  status: VerificationHealthStatus;
  version: string;
  uptime: number; // e.g. 99.98
  lastHealthCheck: string; // ISO 8601
  itemsProcessed24h: number;
  avgConfidence: number; // percentage e.g. 0.96
  avgLatencyMs: number; // p95 ms
  primaryMetricLabel: string;
  primaryMetricValue: string | number;
}

export type ClaimVerdictType =
  | "TRUE"
  | "FALSE"
  | "MISLEADING"
  | "UNVERIFIED"
  | "HALF_TRUE";

export type ClaimCategory =
  | "FACTUAL"
  | "OPINION"
  | "PREDICTION"
  | "STATISTICAL"
  | "QUOTATION";

export interface EvidenceItemData {
  evidenceId: string;
  claimId: string;
  type: "SUPPORTING" | "REFUTING" | "NEUTRAL";
  description: string;
  source: string;
  url?: string;
  reliabilityScore: number; // 0.0 to 1.0
  isOfficial: boolean; // .gov / .edu star icon
  isPrimary?: boolean;
  timestamp: string; // ISO 8601
}

export interface FactCheckVerdictItem {
  claimId: string;
  claimText: string;
  claimType: ClaimCategory;
  verdict: ClaimVerdictType;
  confidence: number; // 0.0 to 1.0
  sources: Array<{ name: string; url: string }>;
  evidence: EvidenceItemData[];
  timestamp: string; // ISO 8601
  explanation?: string;
  aiAnalysisSummary?: string;
}

export interface CrossReferenceMatrixRow {
  claimId: string;
  claimText?: string;
  totalSources: number;
  independentSources: number;
  corroborated: boolean;
  confidence: number; // 0.0 to 1.0
  sourceRelationships?: string[];
}

export interface CrossReferenceResultData {
  strongCount: number; // 3+ independent sources
  moderateCount: number; // 2 independent sources
  weakCount: number; // 1 independent source
  noneCount: number; // 0 independent sources
  avgIndependentSources: number;
  parentCompanyConflicts: number;
  syndicatedFlags: number;
  sourceMatrix: CrossReferenceMatrixRow[];
}

export type SourceAuthenticityType =
  | "AUTHENTICATED"
  | "SUSPICIOUS"
  | "IMPERSONATING"
  | "UNVERIFIED"
  | "BOT";

export interface SourceVerificationItemData {
  sourceId: string;
  sourceName: string;
  domain: string;
  authenticity: SourceAuthenticityType;
  authorityScore: number; // 0.0 to 1.0
  verificationMethod: "REGISTRY" | "AI_GATEWAY" | "PATTERN";
  identityConsistency?: boolean;
}

export interface ExtractedClaimItemData {
  claimId: string;
  claimText: string;
  claimType: ClaimCategory;
  isVerifiable: boolean;
  sourceContent: string;
  timestamp: string; // ISO 8601
}

export interface BiasClassificationData {
  none: number; // counts
  political: number;
  commercial: number;
  cultural: number;
  selection: number;
}

export interface BiasAnalysisItem {
  contentId: string;
  classification: "NONE" | "POLITICAL" | "COMMERCIAL" | "CULTURAL" | "SELECTION";
  severity: number; // 0.0 to 1.0
  indicators: Array<{ textExample: string; description: string }>;
  emotionalLanguageFlags: string[];
  selfAwarenessFlag: boolean;
}

export type MisinfoClassificationType =
  | "CLEAN"
  | "SATIRE"
  | "MISINFORMATION"
  | "DISINFORMATION"
  | "MALINFORMATION";

export interface MisinformationFlagItem {
  flagId: string;
  contentId: string;
  classification: MisinfoClassificationType;
  riskScore: number; // 0.0 to 1.0
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  contributingFactors: string[];
  intentDistinction: string;
  recommendedAction?: string;
}

export interface ConfidenceFactorBreakdown {
  factCheckScore: number; // 30% weight
  crossRefScore: number; // 25% weight
  sourceScore: number; // 20% weight
  evidenceScore: number; // 15% weight
  biasScore: number; // 10% weight
}

export interface ConfidenceScoreItemData {
  storyId: string;
  finalScore: number; // 0.0 to 1.0
  tier: "VERIFIED_TRUTH" | "PROVISIONAL" | "DOUBTFUL";
  breakdown: ConfidenceFactorBreakdown;
  uncertainty: number;
  isAnomaly: boolean;
  timestamp: string; // ISO 8601
}
