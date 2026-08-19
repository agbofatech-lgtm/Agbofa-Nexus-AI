import type { Agent } from "@/types/agents";
import type { DataConfidence, DataProvenance } from "@/types/data-state";
import type {
  OverrideHistoryRecord,
  StrategyExecutionReality,
  StrategyRisk,
} from "@/types/strategy-director";

export type Phase5ExecutionReality = StrategyExecutionReality;
export type AutonomyLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type AutonomyDomainId =
  | "STRATEGY"
  | "CONTENT"
  | "DISTRIBUTION"
  | "PUBLISHING"
  | "EXPERIMENTS"
  | "PAID_GROWTH";
export type ApprovalRequirement =
  | "ALWAYS"
  | "RISK_BASED"
  | "BUDGET_BASED"
  | "SENSITIVE_ONLY"
  | "NOT_APPLICABLE";
export type PolicyState = "CONFIGURED" | "NEEDS_REVIEW" | "DISABLED";
export type RunState =
  | "DRAFT"
  | "READY"
  | "SIMULATING"
  | "PAUSED"
  | "WAITING_APPROVAL"
  | "COMPLETED"
  | "STOPPED"
  | "FAILED";
export type MemoryCategory =
  | "OBSERVATION"
  | "PATTERN"
  | "STRATEGIC_INSIGHT"
  | "EXPERIMENT_LEARNING"
  | "CONTENT_LEARNING"
  | "AUDIENCE_LEARNING"
  | "DISTRIBUTION_LEARNING"
  | "AGENT_LEARNING";
export type MemoryTrustState =
  | "NEW"
  | "ACTIVE"
  | "NEEDS_REVIEW"
  | "STALE"
  | "CONTRADICTED"
  | "ARCHIVED"
  | "SIMULATED";
export type MemoryFreshness =
  | "CURRENT"
  | "STALE"
  | "NEEDS_REVIEW"
  | "CONTRADICTED"
  | "ARCHIVED";
export type KillSwitchState =
  | "ARMED"
  | "SIMULATED_STOP_REQUESTED"
  | "SIMULATED_STOP_APPLIED"
  | "UNAVAILABLE";
export type ScenarioRisk = "LOW" | "MEDIUM" | "HIGH";
export type ScenarioMode = "BASELINE" | "HIGH_QUALITY" | "BALANCED" | "LOW_COST";
export type LatencyClass = "FAST" | "STANDARD" | "DELIBERATE";
export type ModelComplexity = "LOW" | "MEDIUM" | "HIGH";

export interface AutonomyLevelDefinition {
  level: AutonomyLevel;
  label: "OBSERVE" | "RECOMMEND" | "PREPARE" | "APPROVAL-GATED" | "BOUNDED" | "AUTONOMOUS";
  description: string;
  humanRole: string;
  futureCapability: string;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface BudgetBoundary {
  amount: number | null;
  currency: "USD";
  basis: string;
  authority: "ESTIMATED" | "UNAVAILABLE";
  provenance: DataProvenance;
  executionReality: "ESTIMATED" | "UNAVAILABLE";
}

export interface AutonomyDomainPolicy {
  id: AutonomyDomainId;
  label: string;
  level: AutonomyLevel;
  approvalRequirement: ApprovalRequirement;
  riskTolerance: "LOW" | "MEDIUM" | "HIGH";
  executionBounds: string[];
  budgetBoundary: BudgetBoundary;
  humanInterventionRule: string;
  allowedActions: string[];
  restrictedActions: string[];
  policyState: PolicyState;
  backendEnforcement: "UNAVAILABLE";
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface ApprovalPolicy {
  id: string;
  name: string;
  domain: AutonomyDomainId;
  trigger: string;
  approvalRequirement: ApprovalRequirement;
  risk: "LOW" | "MEDIUM" | "HIGH";
  actionScope: string;
  state: "ACTIVE_SIMULATION" | "NEEDS_REVIEW" | "DISABLED";
  backendEnforcement: "UNAVAILABLE";
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface RunApprovalGate {
  id: string;
  label: string;
  state: "PENDING" | "SIMULATED_APPROVED" | "BLOCKED";
  reason: string;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface SimulatedAutonomousRun {
  id: string;
  objective: string;
  strategyId: string;
  initiativeId: string;
  taskIds: string[];
  agentIds: Agent["id"][];
  state: RunState;
  currentStage: "PLAN" | "PREPARE" | "APPROVAL" | "SIMULATED_EXECUTION" | "REVIEW" | "SIMULATED_RESULT";
  progress: number;
  estimatedBudget: BudgetBoundary;
  estimatedCost: number;
  risk: StrategyRisk;
  approvalGates: RunApprovalGate[];
  interventionPoints: string[];
  outcome: string;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface MemoryEvidence {
  id: string;
  sourceType: "GROWTH" | "ANALYTICS" | "EXPERIMENT" | "STRATEGY" | "RUN_SIMULATION";
  sourceId: string;
  observation: string;
  observedAt: string;
  confidence: DataConfidence;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface MemoryRecord {
  id: string;
  insight: string;
  category: MemoryCategory;
  source: string;
  evidence: MemoryEvidence[];
  observationPeriod: string;
  confidence: DataConfidence;
  sampleSize: number | null;
  lastObserved: string;
  createdAt: string;
  updatedAt: string;
  applicability: string[];
  trustState: MemoryTrustState;
  freshness: MemoryFreshness;
  reviewStatus: "PENDING" | "SIMULATED_REVIEWED" | "NOT_REVIEWED";
  expirationReview: string;
  conflictIds: string[];
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface MemoryConflict {
  id: string;
  memoryIds: [string, string];
  reason: string;
  evidenceComparison: string;
  observationPeriods: [string, string];
  resolutionStatus: "OPEN" | "NEEDS_REVIEW" | "SIMULATED_RESOLVED";
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface ProjectionRange {
  minimum: number;
  maximum: number;
  unit: "index" | "percent" | "USD";
}

export interface ScenarioProjection {
  audience: ProjectionRange;
  cost: ProjectionRange;
  revenue: { value: null; label: "UNAVAILABLE"; provenance: DataProvenance };
  engagement: ProjectionRange;
  reach: ProjectionRange;
  roi: { value: null; label: "UNAVAILABLE"; provenance: DataProvenance };
}

export interface ScenarioRecord {
  id: string;
  name: string;
  mode: ScenarioMode;
  baselineScenarioId: string | null;
  variables: Array<{ label: string; value: string; provenance: DataProvenance }>;
  assumptions: string[];
  expectedImpact: string;
  projection: ScenarioProjection;
  qualityScore: number;
  confidence: DataConfidence;
  risk: ScenarioRisk;
  riskRationale: string;
  timeHorizonDays: 30 | 60 | 90;
  tradeOffs: string[];
  optimizationCriterion: string;
  dataSourceLabel: string;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface ModelCandidate {
  modelId: string;
  providerId: string;
  modelName: string;
  availability: "CATALOG" | "UNAVAILABLE";
  estimatedInputRatePerMillion: number;
  estimatedOutputRatePerMillion: number;
  estimatedQuality: number;
  latencyClass: LatencyClass;
  provenance: DataProvenance;
  executionReality: "ESTIMATED" | "UNAVAILABLE";
}

export interface ModelRoutingSimulation {
  id: string;
  taskId: string;
  taskLabel: string;
  complexity: ModelComplexity;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  candidateModelIds: string[];
  selectedModelId: string;
  estimatedCost: number;
  expectedQuality: number;
  latencyClass: LatencyClass;
  reason: string;
  tradeOff: string;
  confidence: DataConfidence;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface TaskCostEstimate {
  id: string;
  taskId: string;
  agentIds: Agent["id"][];
  modelId: string;
  taskType: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
  estimatedQuality: number;
  latencyClass: LatencyClass;
  confidence: DataConfidence;
  costSource: string;
  provenance: DataProvenance;
  executionReality: "ESTIMATED";
}

export interface CostAwareStrategyOption {
  id: string;
  strategyId: string;
  mode: "HIGH_QUALITY" | "BALANCED" | "LOW_COST";
  estimatedAICost: number;
  expectedImpactScore: number;
  qualityScore: number;
  risk: ScenarioRisk;
  confidence: DataConfidence;
  tradeOffs: string[];
  optimizationCriterion: string;
  provenance: DataProvenance;
  executionReality: "ESTIMATED";
}

export interface BudgetSimulationPlan {
  id: string;
  label: string;
  budget: number;
  estimatedTasks: number;
  estimatedModelMix: Array<{ modelId: string; percent: number }>;
  estimatedCost: number;
  expectedImpactScore: number;
  risk: ScenarioRisk;
  confidence: DataConfidence;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface FinancialTruthContract {
  actualCost: { value: null; label: "UNAVAILABLE"; provenance: DataProvenance };
  actualRevenue: { value: null; label: "UNAVAILABLE"; provenance: DataProvenance };
  verifiedRoi: { value: null; label: "UNAVAILABLE"; provenance: DataProvenance };
  estimatedRoi: {
    value: null;
    label: "UNAVAILABLE";
    inputs: string[];
    assumptions: string[];
    costSource: string;
    revenueSource: string;
    confidence: DataConfidence;
    provenance: DataProvenance;
    executionReality: "UNAVAILABLE";
  };
}

export interface AutonomyAuditRecord {
  id: string;
  action: string;
  target: string;
  actor: "Demo autonomy reviewer";
  timestamp: string;
  previousState: string;
  resultingState: string;
  reason: string;
  provenance: DataProvenance;
  executionReality: "SIMULATED";
}

export interface Phase5ExperienceFixture {
  architectureVersion: "phase-5-autonomy-memory-economics-v1";
  levelDefinitions: AutonomyLevelDefinition[];
  autonomyDomains: AutonomyDomainPolicy[];
  approvalPolicies: ApprovalPolicy[];
  runs: SimulatedAutonomousRun[];
  memories: MemoryRecord[];
  memoryConflicts: MemoryConflict[];
  scenarios: ScenarioRecord[];
  modelCandidates: Omit<ModelCandidate, "modelName" | "providerId" | "availability">[];
  routingSimulations: ModelRoutingSimulation[];
  taskCosts: TaskCostEstimate[];
  costAwareStrategies: CostAwareStrategyOption[];
  budgetPlans: BudgetSimulationPlan[];
  killSwitch: {
    state: KillSwitchState;
    backendEnforcement: "UNAVAILABLE";
    disclosure: "Simulation only — no backend execution is affected.";
    provenance: DataProvenance;
    executionReality: "SIMULATED";
  };
  autonomyAudit: AutonomyAuditRecord[];
  overrideHistory: OverrideHistoryRecord[];
  financialTruth: FinancialTruthContract;
  provenance: DataProvenance;
}

export interface Phase5ExperienceData
  extends Omit<Phase5ExperienceFixture, "modelCandidates"> {
  canonicalAgentCount: 28;
  modelCandidates: ModelCandidate[];
}
