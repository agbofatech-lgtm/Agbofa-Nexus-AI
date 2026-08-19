import type { DataConfidence, DataProvenance, DataSource } from "@/types/data-state";
import type { StrategyExecutionReality } from "@/types/strategy-director";

export type ExecutiveSeverity = "INFO" | "WARNING" | "CRITICAL";
export type ExecutiveCapabilityState =
  | "AVAILABLE"
  | "SIMULATED"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "NOT_CONNECTED"
  | "PENDING";
export type ExecutiveLoopStage =
  | "OBSERVE"
  | "UNDERSTAND"
  | "DISCOVER"
  | "RECOMMEND"
  | "DECIDE"
  | "EXECUTE"
  | "MEASURE"
  | "LEARN"
  | "REMEMBER"
  | "NEXT_STRATEGY";
export type ExecutiveSearchDomain =
  | "Story"
  | "Intelligence"
  | "Opportunity"
  | "Agent"
  | "Strategy"
  | "Decision"
  | "Experiment"
  | "Analytics"
  | "Distribution"
  | "Publishing"
  | "Memory"
  | "Scenario"
  | "AI Cost"
  | "AI Control"
  | "Settings";

export interface ExecutiveSignal {
  id: string;
  label: string;
  summary: string;
  sourceId: string;
  confidence: DataConfidence | null;
  provenance: DataProvenance;
  executionReality: StrategyExecutionReality;
}

export interface ExecutiveSituation {
  operatingState: ExecutiveSignal;
  majorChange: ExecutiveSignal;
  topOpportunity: ExecutiveSignal;
  highestRisk: ExecutiveSignal;
  decisionPressure: ExecutiveSignal;
  strategyDirection: ExecutiveSignal;
  learningSignal: ExecutiveSignal;
}

export interface ExecutiveMetric {
  id: string;
  label: string;
  displayValue: string;
  context: string;
  authority: DataSource;
  confidence: DataConfidence | null;
  sourceId: string;
  provenance: DataProvenance;
  executionReality: StrategyExecutionReality;
}

export interface ExecutiveOpportunity {
  id: string;
  title: string;
  priority: number;
  confidence: DataConfidence;
  expectedImpact: string;
  evidenceCount: number;
  href: string;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface ExecutiveStrategy {
  id: string;
  title: string;
  progress: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  confidence: DataConfidence;
  priorityInitiative: string;
  nextAction: string;
  pendingDecisions: number;
  href: string;
  provenance: DataProvenance;
  executionReality: Exclude<StrategyExecutionReality, "ACTUAL">;
}

export interface ExecutiveDecision {
  id: string;
  recommendation: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: DataConfidence;
  risk: "LOW" | "MEDIUM" | "HIGH";
  expectedImpact: string;
  approvalState: string;
  href: string;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface ExecutiveWorkforceSummary {
  total: 28;
  working: number;
  blocked: number;
  waitingApproval: number;
  completed: number;
  failed: number;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface ExecutiveExperimentSummary {
  active: number;
  completed: number;
  resultState: string;
  confidence: DataConfidence;
  learning: string;
  href: string;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface ExecutiveEconomicsSummary {
  estimatedTaskCost: number;
  estimatedBudget: number;
  strategyComparison: string;
  actualCost: "UNAVAILABLE";
  actualRevenue: "UNAVAILABLE";
  verifiedRoi: "UNAVAILABLE";
  provenance: DataProvenance;
  executionReality: "ESTIMATED";
}

export interface ExecutiveLearningSummary {
  id: string;
  insight: string;
  evidenceCount: number;
  confidence: DataConfidence;
  sampleSize: number | null;
  source: string;
  applicability: string[];
  memoryState: string;
  href: string;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface ExecutiveActivityEvent {
  id: string;
  timestamp: string;
  domain: string;
  title: string;
  description: string;
  severity: ExecutiveSeverity;
  status: string;
  sourceId: string;
  provenance: DataProvenance;
  executionReality: "SIMULATED" | "ESTIMATED" | "UNAVAILABLE";
}

export interface ExecutiveLoopNode {
  id: ExecutiveLoopStage;
  order: number;
  description: string;
  href: string;
  capabilityState: ExecutiveCapabilityState;
  provenance: DataProvenance;
  executionReality: StrategyExecutionReality;
}

export interface ExecutiveCapabilityHealth {
  id: string;
  domain: string;
  capability: ExecutiveCapabilityState;
  detail: string;
  telemetryReality: "SIMULATED" | "UNAVAILABLE" | "ESTIMATED";
  sourceId: string;
  href: string;
  provenance: DataProvenance;
  executionReality: StrategyExecutionReality;
}

export interface ExecutiveSearchRecord {
  id: string;
  label: string;
  description: string;
  href: string;
  domain: ExecutiveSearchDomain;
  keywords: string[];
  sourceId: string;
  provenance: DataProvenance;
  executionReality: StrategyExecutionReality;
}

export interface CrossPhaseIntegrityRecord {
  id: string;
  relationship: string;
  sourceId: string;
  targetId: string;
  status: "VALID" | "BROKEN";
  detail: string;
}

export interface ExecutiveCommandData {
  architectureVersion: "phase-6-executive-command-v1";
  situation: ExecutiveSituation;
  metrics: ExecutiveMetric[];
  opportunities: ExecutiveOpportunity[];
  strategies: ExecutiveStrategy[];
  decisions: ExecutiveDecision[];
  workforce: ExecutiveWorkforceSummary;
  experiments: ExecutiveExperimentSummary;
  economics: ExecutiveEconomicsSummary;
  learning: ExecutiveLearningSummary;
  activity: ExecutiveActivityEvent[];
  loop: ExecutiveLoopNode[];
  capabilities: ExecutiveCapabilityHealth[];
  searchIndex: ExecutiveSearchRecord[];
  integrity: CrossPhaseIntegrityRecord[];
  provenance: DataProvenance;
}
