/**
 * Agbofa Nexus AI — Newsroom Workspace Authoritative TypeScript Definitions (P0 Batch 6)
 * Defines the complete content lifecycle types:
 * origination -> verification -> packaging -> review -> publication.
 */

export type OriginationStatus = "NEW" | "PROCESSING" | "ROUTED";
export type OriginationPriority = "BREAKING" | "HIGH" | "STANDARD" | "LOW";

export interface OriginationStory {
  storyId: string;
  headline: string;
  sourcePlatform: string;
  sourceName: string;
  detectedAt: string; // ISO 8601
  status: OriginationStatus;
  priority: OriginationPriority;
  assignedTo: string;
}

export type ClaimType =
  | "FACTUAL"
  | "OPINION"
  | "PREDICTION"
  | "STATISTICAL"
  | "QUOTATION";
export type ClaimVerdict =
  | "TRUE"
  | "FALSE"
  | "MISLEADING"
  | "UNVERIFIED"
  | "HALF_TRUE";
export type SourceVerificationStatus =
  | "AUTHENTICATED"
  | "SUSPICIOUS"
  | "UNVERIFIED"
  | "CREDIBLE";

export interface EvidenceItem {
  evidenceId: string;
  claimId: string;
  type: "SUPPORTING" | "REFUTING" | "NEUTRAL";
  description: string;
  source: string;
  reliability: number; // 0.0 to 1.0
}

export interface VerificationClaim {
  claimId: string;
  claimText: string;
  claimType: ClaimType;
  verdict: ClaimVerdict;
  confidence: number; // 0.0 to 1.0
  crossRefStatus: string;
  sourceVerification: SourceVerificationStatus;
  evidence: EvidenceItem[];
}

export type MisinformationRisk =
  | "CLEAN"
  | "SATIRE"
  | "MISINFORMATION"
  | "DISINFORMATION"
  | "MALINFORMATION";

export interface MisinformationFlag {
  riskClass: MisinformationRisk;
  riskScore: number; // 0.0 to 1.0
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  contributingFactors: string[];
}

export type BiasClassification =
  | "NONE"
  | "POLITICAL"
  | "COMMERCIAL"
  | "CULTURAL"
  | "SELECTION";

export interface BiasDetection {
  classification: BiasClassification;
  severityScore: number; // 0.0 to 1.0
  indicators: Array<{
    textExample: string;
    description: string;
  }>;
}

export interface ConfidenceBreakdown {
  factCheckScore: number; // weight 30%
  crossRefScore: number; // weight 25%
  sourceScore: number; // weight 20%
  evidenceScore: number; // weight 15%
  biasScore: number; // weight 10%
  overallConfidence: number;
  tier: "VERIFIED_TRUTH" | "PROVISIONAL" | "DOUBTFUL";
}

export type PackageType =
  | "ARTICLE"
  | "SOCIAL_POST"
  | "VIDEO_SCRIPT"
  | "AUDIO_TRANSCRIPT"
  | "INFOGRAPHIC_SPEC"
  | "MULTI_CHANNEL";

export type AssetStatus = "PRESENT" | "MISSING" | "GENERATING";

export interface PackageAsset {
  assetId: string;
  type: string;
  title: string;
  content: string;
  status: AssetStatus;
  required: boolean;
}

export interface BrandVoiceScore {
  compatibilityScore: number; // 0.0 to 1.0
  toneAnalysis: string[];
  mismatchWarnings: string[];
  recommendations: string[];
}

export interface PackageItem {
  packageId: string;
  storyId: string;
  packageType: PackageType;
  assets: PackageAsset[];
  assetStatus: AssetStatus;
  brandVoiceScore: BrandVoiceScore;
  status: "DRAFT" | "PACKAGING" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  factualConsistencyVerified: boolean;
  compliancePreCheckPassed: boolean;
  sourceAttributionComplete: boolean;
}

export type ReviewStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUESTED";

export interface ReviewComment {
  commentId: string;
  author: string;
  createdAt: string; // ISO 8601
  text: string;
  targetAssetId?: string;
}

export interface ReviewHistoryItem {
  historyId: string;
  reviewer: string;
  decidedAt: string; // ISO 8601
  decision: ReviewStatus;
  reason: string;
}

export interface ReviewItem {
  packageId: string;
  storyId: string;
  headline: string;
  packageType: PackageType;
  priority: OriginationPriority;
  submittedBy: string;
  submittedAt: string; // ISO 8601
  status: ReviewStatus;
  reviewerNotes: string;
  comments: ReviewComment[];
  history: ReviewHistoryItem[];
  packageDetail?: PackageItem;
}

export interface PipelineStats {
  originationCount: number;
  verificationCount: number;
  factoryCount: number;
  reviewCount: number;
  publishedToday: number;
  publishedTrendChange: number; // e.g. +15%
}

export interface NewsroomActivityItem {
  activityId: string;
  actor: string;
  action: string;
  targetId: string;
  targetTitle: string;
  occurredAt: string; // ISO 8601
  stage: "ORIGINATION" | "VERIFICATION" | "FACTORY" | "REVIEW" | "PUBLISHED";
}
