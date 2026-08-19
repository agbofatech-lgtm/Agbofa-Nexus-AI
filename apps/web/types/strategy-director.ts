import type { Agent } from "@/types/agents";
import type { DataConfidence, DataProvenance } from "@/types/data-state";
import type {
  CostEstimate,
  EvidenceReference,
  ExpectedImpact,
  StrategyDecision,
  StrategyPlan,
} from "@/types/phase2";

export type StrategyExecutionReality =
  | "PLANNED"
  | "SIMULATED"
  | "UNAVAILABLE"
  | "ACTUAL";
export type StrategyRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type StrategyPlanStatus = "DRAFT" | "REVIEW" | "APPROVED" | "SIMULATED";
export type InitiativeStatus =
  | "PLANNED"
  | "IN_REVIEW"
  | "APPROVED"
  | "SIMULATING"
  | "COMPLETED";
export type StrategyTaskStatus =
  | "PLANNED"
  | "WORKING"
  | "BLOCKED"
  | "WAITING_APPROVAL"
  | "COMPLETED"
  | "FAILED";
export type WorkforceStatus =
  | "IDLE"
  | "WORKING"
  | "BLOCKED"
  | "WAITING_APPROVAL"
  | "COMPLETED"
  | "FAILED";
export type ReviewState =
  | "NOT_REQUIRED"
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "REJECTED";
export type DecisionQueueStatus =
  | "PENDING"
  | "REVIEW"
  | "MODIFIED"
  | "APPROVED"
  | "REJECTED";
export type DecisionPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DecisionDomain =
  | "CONTENT"
  | "DISTRIBUTION"
  | "GROWTH"
  | "ANALYTICS"
  | "EXPERIMENTATION"
  | "WORKFORCE";
export type DecisionType =
  | "STRATEGY"
  | "INITIATIVE"
  | "SEQUENCING"
  | "REVIEW"
  | "RESOURCE";
export type OverrideState =
  | "OVERRIDE_REQUESTED"
  | "PAUSE_REQUESTED"
  | "STOP_REQUESTED"
  | "OVERRIDE_APPLIED"
  | "PAUSE_APPLIED"
  | "STOP_APPLIED";
export type TimelineView = "DAY" | "WEEK";

export interface StrategyRisk {
  level: StrategyRiskLevel;
  rationale: string;
  truth: "SIMULATED";
  provenance: DataProvenance;
}

export interface StrategyEvidence extends EvidenceReference {
  source: "Simulated Growth Intelligence" | "Phase 3 experience contract";
  signal: string;
  observation: string;
  timestamp: string;
  confidence: DataConfidence;
  simulated: true;
}

export interface StrategyTask {
  id: string;
  strategyId: string;
  initiativeId: string;
  title: string;
  objective: string;
  status: StrategyTaskStatus;
  progress: number;
  agentIds: Agent["id"][];
  dependencyTaskIds: string[];
  outputs: string[];
  review: ReviewState;
  estimatedCost: CostEstimate;
  risk: StrategyRisk;
  confidence: DataConfidence;
  startDay: number;
  durationDays: number;
  provenance: DataProvenance;
  executionReality: Exclude<StrategyExecutionReality, "ACTUAL">;
}

export interface StrategyDirectorInitiative {
  id: string;
  strategyId: string;
  title: string;
  objective: string;
  description: string;
  status: InitiativeStatus;
  opportunityIds: string[];
  expectedImpact: ExpectedImpact;
  confidence: DataConfidence;
  estimatedCost: CostEstimate;
  risk: StrategyRisk;
  timelineDays: number;
  progress: number;
  tasks: StrategyTask[];
  responsibleAgentIds: Agent["id"][];
  dependencyInitiativeIds: string[];
  provenance: DataProvenance;
  executionReality: Exclude<StrategyExecutionReality, "ACTUAL">;
}

export interface StrategyCrossDomainLinks {
  opportunityIds: string[];
  publishingPlanIds: string[];
  analyticsMetricIds: string[];
  experimentIds: string[];
  storyIds: string[];
}

export interface StrategyDirectorPlan
  extends Omit<
    StrategyPlan,
    "initiatives" | "status" | "risk" | "reality" | "approvalStatus"
  > {
  title: string;
  intelligenceSummary: string;
  opportunities: string[];
  strategy: string;
  expectedOutcomes: string[];
  status: StrategyPlanStatus;
  initiatives: StrategyDirectorInitiative[];
  timelineDays: 30;
  progress: number;
  estimatedCost: CostEstimate;
  risk: StrategyRisk;
  recommendation: string;
  nextAction: string;
  crossDomain: StrategyCrossDomainLinks;
  approvalStatus: "draft" | "pending" | "approved" | "rejected";
  executionReality: Exclude<StrategyExecutionReality, "ACTUAL">;
}

export interface StrategyDirectorDecision
  extends Omit<
    StrategyDecision,
    "status" | "approvalStatus" | "risk" | "evidence"
  > {
  initiativeId: string;
  taskId: string | null;
  evidence: StrategyEvidence[];
  risk: StrategyRisk;
  priority: DecisionPriority;
  domain: DecisionDomain;
  type: DecisionType;
  status: DecisionQueueStatus;
  nextAction: string;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface DecisionHistoryRecord {
  id: string;
  decisionId: string;
  action: "REVIEW" | "MODIFY" | "APPROVE" | "REJECT";
  actor: "Demo strategy reviewer";
  timestamp: string;
  previousStatus: DecisionQueueStatus;
  resultingStatus: DecisionQueueStatus;
  note: string;
  executionReality: "SIMULATED";
  provenance: DataProvenance;
}

export interface WorkforceAgentProjection {
  agent: Agent;
  status: WorkforceStatus;
  currentTask: StrategyTask | null;
  progress: number;
  confidence: DataConfidence;
  dependencyAgentIds: Agent["id"][];
  outputs: string[];
  review: ReviewState;
  estimatedCost: CostEstimate;
  error: string | null;
  strategyIds: string[];
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface StrategyWorkflowStage {
  id:
    | "DISCOVER"
    | "DETECT"
    | "VERIFY"
    | "ANALYZE"
    | "CREATE"
    | "REVIEW"
    | "DISTRIBUTE"
    | "MEASURE"
    | "OPTIMIZE";
  order: number;
  title: string;
  progress: number;
  agentIds: Agent["id"][];
  taskIds: string[];
  dependencyStageIds: string[];
  outputs: string[];
  reviewRequired: boolean;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface StrategyTimelineItem {
  id: string;
  strategyId: string;
  initiativeId: string;
  taskId: string;
  agentId: Agent["id"];
  title: string;
  day: number;
  durationDays: number;
  milestone: boolean;
  status: StrategyTaskStatus;
  provenance: DataProvenance;
  executionReality: "PLANNED" | "SIMULATED";
}

export interface OverrideHistoryRecord {
  id: string;
  action: "PAUSE" | "STOP" | "OVERRIDE";
  targetType: "STRATEGY" | "INITIATIVE" | "TASK" | "AGENT";
  targetId: string;
  timestamp: string;
  actor: "Demo strategy reviewer";
  previousState: string;
  resultingState: OverrideState;
  reason: string;
  executionReality: "SIMULATED";
  provenance: DataProvenance;
}

export interface StrategyDirectorFixture {
  architectureVersion: "phase-4-strategy-director-v1";
  currentObjective: string;
  currentSituation: string;
  intelligence: string[];
  plans: StrategyDirectorPlan[];
  decisions: StrategyDirectorDecision[];
  decisionHistory: DecisionHistoryRecord[];
  workflow: StrategyWorkflowStage[];
  timeline: StrategyTimelineItem[];
  overrideHistory: OverrideHistoryRecord[];
  provenance: DataProvenance;
}

export interface StrategyDirectorData extends StrategyDirectorFixture {
  canonicalAgentCount: 28;
  workforce: WorkforceAgentProjection[];
}
