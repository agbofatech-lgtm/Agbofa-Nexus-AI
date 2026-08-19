import type { Agent } from "@/types/agents";
import type {
  ExecutionReality,
  FrontendCapability,
} from "@/types/capabilities";
import type { DataConfidence, DataProvenance } from "@/types/data-state";
import type {
  ExecutionFeatureFlag,
  FrontendFeatureFlag,
} from "@/types/feature-flags";

export type RiskLevel = "low" | "guarded" | "elevated" | "critical";
export type OpportunityStatus =
  "discovered" | "qualified" | "prioritized" | "rejected" | "expired";
export type OpportunitySource =
  | "trend"
  | "content-gap"
  | "audience"
  | "competitor"
  | "distribution"
  | "conversion"
  | "revenue";
export type ApprovalStatus =
  "draft" | "pending" | "changes-requested" | "approved" | "rejected";
export type DecisionStatus =
  "draft" | "proposed" | "approved" | "declined" | "superseded";
export type StrategyStatus =
  | "draft"
  | "review"
  | "approved"
  | "simulated"
  | "execution-unavailable"
  | "completed";
export type ForecastHorizon = 30 | 60 | 90;
export type AutonomyLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type AutonomyDomain =
  | "strategy"
  | "content"
  | "distribution"
  | "publishing"
  | "experiments"
  | "paid-growth";
export type ConfidenceAssessment = DataConfidence;
export interface EvidenceReference {
  id: string;
  label: string;
  detail: string;
  sourceUrl?: string;
  provenance: DataProvenance;
}
export interface ExpectedImpact {
  label: string;
  value: number | null;
  unit: "%" | "currency" | "count" | "score";
  range?: { minimum: number; maximum: number };
  provenance: DataProvenance;
}
export interface CostEstimate {
  amount: number | null;
  currency: string;
  basis: string;
  provenance: DataProvenance;
}
export interface GrowthOpportunity {
  id: string;
  title: string;
  summary: string;
  source: OpportunitySource;
  status: OpportunityStatus;
  evidence: EvidenceReference[];
  confidence: ConfidenceAssessment;
  expectedImpact: ExpectedImpact;
  estimatedCost: CostEstimate;
  risk: RiskLevel;
  recommendedAction: string;
  provenance: DataProvenance;
}
export interface ForecastScenario {
  id: string;
  label: string;
  horizonDays: ForecastHorizon;
  assumptions: string[];
  audience: ExpectedImpact;
  revenue: ExpectedImpact;
  cost: CostEstimate;
  confidence: ConfidenceAssessment;
  reality: ExecutionReality;
}
export interface StrategyInitiative {
  id: string;
  title: string;
  opportunityIds: string[];
  expectedImpact: ExpectedImpact;
  estimatedCost: CostEstimate;
  risk: RiskLevel;
  timelineDays: number;
}
export interface StrategyPlan {
  id: string;
  objective: string;
  situation: string;
  status: StrategyStatus;
  initiatives: StrategyInitiative[];
  confidence: ConfidenceAssessment;
  approvalStatus: ApprovalStatus;
  reality: ExecutionReality;
  provenance: DataProvenance;
}
export interface StrategyDecision {
  id: string;
  strategyId: string;
  recommendation: string;
  reason: string;
  evidence: EvidenceReference[];
  confidence: ConfidenceAssessment;
  expectedImpact: ExpectedImpact;
  estimatedCost: CostEstimate;
  risk: RiskLevel;
  status: DecisionStatus;
  approvalStatus: ApprovalStatus;
}
export interface AgentPlanTask {
  id: string;
  agentId: Agent["id"];
  title: string;
  status:
    | "planned"
    | "queued"
    | "running"
    | "waiting"
    | "review"
    | "completed"
    | "failed";
  progress: number;
  strategyId: string;
  resultId?: string;
  reviewRequired: boolean;
  reality: ExecutionReality;
}
export interface AutonomousRun {
  id: string;
  objective: string;
  status:
    "preview" | "simulated" | "paused" | "stopped" | "execution-unavailable";
  progress: number;
  agentIds: Agent["id"][];
  budget: CostEstimate;
  risk: RiskLevel;
  autonomyLevel: AutonomyLevel;
  reality: ExecutionReality;
}
export interface MemoryRecord {
  id: string;
  type: "observation" | "decision" | "outcome" | "learning" | "superseded";
  insight: string;
  evidence: EvidenceReference[];
  sampleSize: number | null;
  period: string;
  confidence: ConfidenceAssessment;
  provenance: DataProvenance;
}
export interface Phase2FoundationSnapshot {
  canonicalAgentCount: 28;
  features: Readonly<Record<FrontendFeatureFlag, boolean>>;
  execution: Readonly<Record<ExecutionFeatureFlag, boolean>>;
  capabilities: FrontendCapability[];
  architectureVersion: "phase-1-reconstruction-v1";
  provenance: DataProvenance;
}
