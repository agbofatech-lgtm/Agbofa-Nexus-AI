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
export type ExecutiveReality =
  | StrategyExecutionReality
  | "PROJECTED"
  | "PENDING"
  | "NOT_CONNECTED"
  | "DEGRADED"
  | "RECOMMENDATION"
  | "FIXTURE";
export type ExecutiveClassification =
  | "ACTUAL"
  | "SIMULATION"
  | "ESTIMATED"
  | "PROJECTED"
  | "RECOMMENDATION"
  | "PLANNED"
  | "PENDING"
  | "UNAVAILABLE"
  | "NOT_CONNECTED"
  | "DEGRADED"
  | "FIXTURE"
  | "DEMO";
export type LiveSourceState =
  | "LIVE"
  | "UNAUTHENTICATED"
  | "UNAVAILABLE"
  | "ERROR"
  | "NOT_FETCHED";
export type PhaseCertificationState =
  | "CERTIFIED"
  | "PARTIALLY CERTIFIED"
  | "IMPLEMENTED"
  | "CONDITIONAL"
  | "NOT CERTIFIED"
  | "PENDING"
  | "BLOCKED";

export interface ExecutiveSignal {
  id: string;
  label: string;
  summary: string;
  sourceId: string;
  confidence: DataConfidence | null;
  provenance: DataProvenance;
  executionReality: ExecutiveReality;
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
  executionReality: ExecutiveReality;
  classification: ExecutiveClassification;
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
  classification: "FIXTURE";
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
  classification: "FIXTURE" | "RECOMMENDATION";
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
  classification: "RECOMMENDATION";
}

export interface ExecutiveWorkforceSummary {
  total: number;
  registeredSource: "FIXTURE" | "UNAVAILABLE";
  liveTelemetry: "UNAVAILABLE" | "PENDING";
  working: number;
  blocked: number;
  waitingApproval: number;
  completed: number;
  failed: number;
  provenance: DataProvenance;
  executionReality: "SIMULATED" | "UNAVAILABLE";
  classification: "FIXTURE" | "UNAVAILABLE";
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
  classification: "FIXTURE";
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
  classification: "ESTIMATED";
  costKind: "ESTIMATED";
}

export interface ExecutiveLearningSummary {
  id: string;
  insight: string;
  evidenceCount: number;
  confidence: DataConfidence;
  sampleSize: number | null;
  source: string;
  classification: MemoryDisplayClassification;
  applicability: string[];
  memoryState: string;
  href: string;
  provenance: DataProvenance;
  executionReality: ExecutiveReality;
  privilege: "DATA_ONLY";
}

export type MemoryDisplayClassification =
  | "OBSERVATION"
  | "FIXTURE"
  | "ACTUAL"
  | "PENDING"
  | "UNAVAILABLE";

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
  executionReality: ExecutiveReality;
  classification: ExecutiveClassification;
}

export interface ExecutiveLoopNode {
  id: ExecutiveLoopStage;
  order: number;
  description: string;
  href: string;
  capabilityState: ExecutiveCapabilityState;
  provenance: DataProvenance;
  executionReality: ExecutiveReality;
}

export interface ExecutiveCapabilityHealth {
  id: string;
  domain: string;
  capability: ExecutiveCapabilityState;
  detail: string;
  telemetryReality: ExecutiveReality;
  sourceId: string;
  href: string;
  provenance: DataProvenance;
  executionReality: ExecutiveReality;
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
  executionReality: ExecutiveReality;
  mutates: false;
}

export interface CrossPhaseIntegrityRecord {
  id: string;
  relationship: string;
  sourceId: string;
  targetId: string;
  status: "VALID" | "BROKEN";
  detail: string;
}

export interface ExecutiveAttributionStage {
  stage: "CONTENT" | "DISTRIBUTION" | "AUDIENCE" | "CONVERSION" | "REVENUE";
  value: string;
  state: "OBSERVED" | "ESTIMATED" | "ATTRIBUTED" | "UNKNOWN" | "UNAVAILABLE";
  evidence: string;
  caveat: string;
  executionReality: ExecutiveReality;
}

export interface ExecutiveAttribution {
  id: string;
  label: string;
  causality: "NOT_ESTABLISHED";
  stages: ExecutiveAttributionStage[];
  provenance: DataProvenance;
  classification: "FIXTURE" | "UNAVAILABLE";
}

export interface ExecutivePhaseStatus {
  id: "PHASE_01" | "PHASE_02" | "PHASE_03" | "PHASE_04" | "PHASE_05" | "PHASE_06";
  label: string;
  status: PhaseCertificationState;
  note: string;
  mutable: false;
}

export interface ExecutiveAutonomyDomain {
  id: string;
  label: string;
  level: number;
  approvalRequirement: string;
  source: LiveSourceState;
  executionReality: ExecutiveReality;
}

export interface ExecutiveGovernance {
  killSwitch: {
    state: string;
    source: LiveSourceState;
    blocksPublishingSchedule: boolean;
    executionReality: ExecutiveReality;
    note: string;
  };
  autonomy: {
    globalLevel: number | null;
    domains: ExecutiveAutonomyDomain[];
    source: LiveSourceState;
    grantsAutonomy: false;
  };
  publishing: {
    chain: string[];
    bypass: false;
    note: string;
  };
  branding: {
    required: true;
    missingBlocksPublish: true;
    note: string;
  };
  memoryPrivilege: {
    memoryIsData: true;
    canGrantRbac: false;
    canApprovePublish: false;
    canDisableSafety: false;
    note: string;
  };
  scenarios: {
    kind: "PROJECTED";
    historicalActuals: false;
    note: string;
  };
  cost: {
    kind: "ESTIMATED";
    invoices: false;
    note: string;
  };
}

export interface ExecutiveLiveSources {
  session: LiveSourceState;
  autonomyControl: LiveSourceState;
  cost: LiveSourceState;
  memory: LiveSourceState;
  scenarios: LiveSourceState;
  accounts: LiveSourceState;
  distributions: LiveSourceState;
}

export interface ExecutiveCommandData {
  architectureVersion: "phase-6-executive-command-v2";
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
  attribution: ExecutiveAttribution;
  phases: ExecutivePhaseStatus[];
  governance: ExecutiveGovernance;
  liveSources: ExecutiveLiveSources;
  provenance: DataProvenance;
}
