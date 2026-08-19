import { strategyDirectorFixture } from "@/lib/mocks/strategy-director";
import type { Agent } from "@/types/agents";
import { createDataProvenance } from "@/types/data-state";
import type {
  ApprovalPolicy,
  AutonomyDomainPolicy,
  AutonomyLevelDefinition,
  BudgetSimulationPlan,
  CostAwareStrategyOption,
  MemoryEvidence,
  MemoryRecord,
  ModelRoutingSimulation,
  Phase5ExperienceFixture,
  ScenarioRecord,
  TaskCostEstimate,
} from "@/types/phase5-experience";

const simulated = createDataProvenance(
  "mock",
  "Phase 5 deterministic autonomy simulation",
  "Frontend-only policy, run, memory, scenario, and intervention fixtures. No autonomous execution or persistence exists.",
);
const estimated = createDataProvenance(
  "estimated",
  "Phase 5 deterministic economics model",
  "Illustrative token, model, quality, latency, and cost assumptions. Not provider billing or actual spend.",
);
const unavailable = createDataProvenance(
  "unavailable",
  "Authoritative runtime unavailable",
  "No autonomy enforcement, memory persistence, scenario engine, provider routing, billing, revenue, ROI, or financial execution backend is connected.",
);
const confidence = (
  score: number,
  basis: string,
  kind: "model" | "estimate" | "evidence" = "model",
) => ({ score, basis, kind });
const budget = (amount: number | null, basis: string) => ({
  amount,
  currency: "USD" as const,
  basis,
  authority: amount === null ? ("UNAVAILABLE" as const) : ("ESTIMATED" as const),
  provenance: amount === null ? unavailable : estimated,
  executionReality:
    amount === null ? ("UNAVAILABLE" as const) : ("ESTIMATED" as const),
});
const risk = (level: "LOW" | "MEDIUM" | "HIGH", rationale: string) => ({
  level,
  rationale,
  truth: "SIMULATED" as const,
  provenance: simulated,
});

const levelDefinitions: AutonomyLevelDefinition[] = [
  { level: 0, label: "OBSERVE", description: "Nexus observes and reports modeled signals.", humanRole: "Human interprets all observations.", futureCapability: "Read-only operational awareness", provenance: simulated, executionReality: "SIMULATED" },
  { level: 1, label: "RECOMMEND", description: "Nexus recommends possible actions.", humanRole: "Human decides whether to proceed.", futureCapability: "Recommendation assistance", provenance: simulated, executionReality: "SIMULATED" },
  { level: 2, label: "PREPARE", description: "Nexus prepares reviewable artifacts.", humanRole: "Human reviews every artifact.", futureCapability: "Artifact preparation under policy", provenance: simulated, executionReality: "SIMULATED" },
  { level: 3, label: "APPROVAL-GATED", description: "A future system could act only after explicit approval.", humanRole: "Human approval would be mandatory.", futureCapability: "Approval-gated execution", provenance: simulated, executionReality: "SIMULATED" },
  { level: 4, label: "BOUNDED", description: "A future system could act within defined policy bounds.", humanRole: "Human defines bounds and monitors exceptions.", futureCapability: "Bounded policy enforcement", provenance: simulated, executionReality: "SIMULATED" },
  { level: 5, label: "AUTONOMOUS", description: "A future system could operate under autonomous policy.", humanRole: "Human governance and emergency intervention remain required.", futureCapability: "Autonomous policy runtime", provenance: simulated, executionReality: "SIMULATED" },
];

const autonomyDomains: AutonomyDomainPolicy[] = [
  { id: "STRATEGY", label: "Strategy", level: 1, approvalRequirement: "ALWAYS", riskTolerance: "MEDIUM", executionBounds: ["Recommend priorities", "Prepare decision evidence"], budgetBoundary: budget(900, "Estimated monthly strategy-analysis ceiling"), humanInterventionRule: "Human reviews every strategy change.", allowedActions: ["Observe signals", "Recommend plans"], restrictedActions: ["Approve strategy", "Dispatch tasks", "Change policy"], policyState: "CONFIGURED", backendEnforcement: "UNAVAILABLE", provenance: simulated, executionReality: "SIMULATED" },
  { id: "CONTENT", label: "Content", level: 2, approvalRequirement: "SENSITIVE_ONLY", riskTolerance: "LOW", executionBounds: ["Prepare outlines", "Prepare review drafts"], budgetBoundary: budget(1200, "Estimated monthly content-preparation ceiling"), humanInterventionRule: "Sensitive, high-risk, or low-confidence content requires review.", allowedActions: ["Prepare artifacts", "Request review"], restrictedActions: ["Publish", "Approve claims", "Bypass verification"], policyState: "CONFIGURED", backendEnforcement: "UNAVAILABLE", provenance: simulated, executionReality: "SIMULATED" },
  { id: "DISTRIBUTION", label: "Distribution", level: 2, approvalRequirement: "ALWAYS", riskTolerance: "LOW", executionBounds: ["Prepare platform adaptations", "Prepare queue plans"], budgetBoundary: budget(500, "Estimated adaptation-only ceiling"), humanInterventionRule: "Every destination and adaptation requires human review.", allowedActions: ["Adapt locally", "Prepare schedule"], restrictedActions: ["Connect accounts", "Send to providers", "Mutate queues externally"], policyState: "CONFIGURED", backendEnforcement: "UNAVAILABLE", provenance: simulated, executionReality: "SIMULATED" },
  { id: "PUBLISHING", label: "Publishing", level: 0, approvalRequirement: "ALWAYS", riskTolerance: "LOW", executionBounds: ["Observe readiness only"], budgetBoundary: budget(null, "Publishing budget authority unavailable"), humanInterventionRule: "Publishing remains unavailable regardless of simulated level.", allowedActions: ["Inspect state", "Review preview"], restrictedActions: ["Publish", "Schedule externally", "Retry provider delivery"], policyState: "DISABLED", backendEnforcement: "UNAVAILABLE", provenance: simulated, executionReality: "SIMULATED" },
  { id: "EXPERIMENTS", label: "Experiments", level: 2, approvalRequirement: "ALWAYS", riskTolerance: "MEDIUM", executionBounds: ["Prepare hypotheses", "Prepare simulated variants"], budgetBoundary: budget(700, "Estimated analysis-only ceiling"), humanInterventionRule: "Human approves design; no audience can be enrolled.", allowedActions: ["Simulate design", "Review statistics"], restrictedActions: ["Enroll audience", "Assign treatment", "Claim causality"], policyState: "NEEDS_REVIEW", backendEnforcement: "UNAVAILABLE", provenance: simulated, executionReality: "SIMULATED" },
  { id: "PAID_GROWTH", label: "Paid Growth", level: 0, approvalRequirement: "NOT_APPLICABLE", riskTolerance: "LOW", executionBounds: ["Display unavailable state"], budgetBoundary: budget(null, "No paid-spend authority or source"), humanInterventionRule: "Any future paid action requires explicit financial authorization.", allowedActions: ["Inspect requirements"], restrictedActions: ["Spend", "Bid", "Purchase media", "Change financial state"], policyState: "DISABLED", backendEnforcement: "UNAVAILABLE", provenance: simulated, executionReality: "SIMULATED" },
];

const approvalPolicies: ApprovalPolicy[] = [
  ["policy-spend", "Paid spending", "PAID_GROWTH", "Any non-zero planned spend", "ALWAYS", "HIGH", "Financial action"],
  ["policy-publish", "Publishing", "PUBLISHING", "Any external delivery intent", "ALWAYS", "HIGH", "Provider publishing"],
  ["policy-sensitive", "Sensitive topics", "CONTENT", "Sensitive-topic classification", "SENSITIVE_ONLY", "HIGH", "Editorial content"],
  ["policy-risk", "High-risk content", "CONTENT", "Risk assessed HIGH", "RISK_BASED", "HIGH", "Content preparation"],
  ["policy-strategy", "Strategy changes", "STRATEGY", "Objective or initiative change", "ALWAYS", "MEDIUM", "Strategy recommendation"],
  ["policy-account", "Account changes", "DISTRIBUTION", "Connection or ownership change", "ALWAYS", "HIGH", "Account configuration"],
  ["policy-campaign", "Major campaigns", "DISTRIBUTION", "Multi-platform campaign plan", "ALWAYS", "MEDIUM", "Campaign preparation"],
  ["policy-experiment", "Experiments", "EXPERIMENTS", "Any audience or success-metric definition", "ALWAYS", "MEDIUM", "Experiment specification"],
  ["policy-distribution", "Distribution changes", "DISTRIBUTION", "Destination, schedule, or format change", "ALWAYS", "MEDIUM", "Distribution plan"],
].map(([id, name, domain, trigger, approvalRequirement, policyRisk, actionScope]) => ({
  id: id as string,
  name: name as string,
  domain: domain as ApprovalPolicy["domain"],
  trigger: trigger as string,
  approvalRequirement: approvalRequirement as ApprovalPolicy["approvalRequirement"],
  risk: policyRisk as ApprovalPolicy["risk"],
  actionScope: actionScope as string,
  state: domain === "PAID_GROWTH" || domain === "PUBLISHING" ? "DISABLED" as const : "ACTIVE_SIMULATION" as const,
  backendEnforcement: "UNAVAILABLE" as const,
  provenance: simulated,
  executionReality: "SIMULATED" as const,
}));

const memoryEvidence = (
  id: string,
  sourceType: MemoryEvidence["sourceType"],
  sourceId: string,
  observation: string,
  score: number,
): MemoryEvidence => ({
  id,
  sourceType,
  sourceId,
  observation,
  observedAt: "2026-08-19T09:00:00.000Z",
  confidence: confidence(score, "Deterministic cross-phase simulation evidence", "evidence"),
  provenance: simulated,
  executionReality: "SIMULATED",
});
const memory = (
  input: Omit<MemoryRecord, "source" | "createdAt" | "updatedAt" | "provenance" | "executionReality">,
): MemoryRecord => ({
  ...input,
  source: input.evidence.map((item) => `${item.sourceType}:${item.sourceId}`).join(" · "),
  createdAt: "2026-08-19T10:00:00.000Z",
  updatedAt: "2026-08-19T12:00:00.000Z",
  provenance: simulated,
  executionReality: "SIMULATED",
});
const memories: MemoryRecord[] = [
  memory({ id: "mem-ai-demand", insight: "Practical AI explainers remain the strongest modeled editorial opportunity.", category: "STRATEGIC_INSIGHT", evidence: [memoryEvidence("me-ai", "GROWTH", "opp-ai-explainers", "Opportunity score and coverage gap align in the Phase 2 fixture.", 89)], observationPeriod: "30-day simulated signal window", confidence: confidence(89, "Growth opportunity and gap agreement"), sampleSize: null, lastObserved: "2026-08-19T09:00:00.000Z", applicability: ["strat-ai-literacy", "CONTENT"], trustState: "ACTIVE", freshness: "CURRENT", reviewStatus: "SIMULATED_REVIEWED", expirationReview: "Review after 30 simulated days", conflictIds: [] }),
  memory({ id: "mem-evidence-format", insight: "Evidence-first framing is promising but not causally validated.", category: "EXPERIMENT_LEARNING", evidence: [memoryEvidence("me-exp", "EXPERIMENT", "exp-completed", "The simulated interval crosses zero and p exceeds the threshold.", 100)], observationPeriod: "One simulated experiment fixture", confidence: confidence(100, "Statistical fixture interpretation", "evidence"), sampleSize: 3200, lastObserved: "2026-08-19T09:20:00.000Z", applicability: ["strat-ai-literacy", "EXPERIMENTS"], trustState: "NEEDS_REVIEW", freshness: "NEEDS_REVIEW", reviewStatus: "PENDING", expirationReview: "Reassess when authoritative experiment data exists", conflictIds: [] }),
  memory({ id: "mem-video-positive", insight: "Short-form visual briefings may fit founder audiences.", category: "AUDIENCE_LEARNING", evidence: [memoryEvidence("me-video-growth", "GROWTH", "opp-creator-video", "Synthetic cohorts model visual-format affinity.", 79)], observationPeriod: "Modeled 30-day audience window", confidence: confidence(79, "Synthetic audience-format affinity"), sampleSize: null, lastObserved: "2026-08-19T09:30:00.000Z", applicability: ["strat-founder-visual", "CONTENT"], trustState: "CONTRADICTED", freshness: "CONTRADICTED", reviewStatus: "PENDING", expirationReview: "Resolve conflict before recommendation", conflictIds: ["conf-video"] }),
  memory({ id: "mem-video-negative", insight: "Short-form visual briefings may reduce evidence comprehension for the modeled segment.", category: "CONTENT_LEARNING", evidence: [memoryEvidence("me-video-analytics", "ANALYTICS", "metric-content", "The content heuristic penalizes compressed evidence context.", 68)], observationPeriod: "Modeled content-quality window", confidence: confidence(68, "Heuristic content-quality model"), sampleSize: null, lastObserved: "2026-08-19T09:35:00.000Z", applicability: ["strat-founder-visual", "CONTENT"], trustState: "CONTRADICTED", freshness: "CONTRADICTED", reviewStatus: "PENDING", expirationReview: "Resolve conflict before recommendation", conflictIds: ["conf-video"] }),
  memory({ id: "mem-no-provider", insight: "Distribution plans must remain structural because no provider is connected.", category: "DISTRIBUTION_LEARNING", evidence: [memoryEvidence("me-dist", "ANALYTICS", "metric-distribution", "Phase 3 reports zero verified provider connections.", 100)], observationPeriod: "Repository-state observation", confidence: confidence(100, "Repository and feature-flag evidence", "evidence"), sampleSize: null, lastObserved: "2026-08-19T09:40:00.000Z", applicability: ["DISTRIBUTION", "PUBLISHING"], trustState: "ACTIVE", freshness: "CURRENT", reviewStatus: "SIMULATED_REVIEWED", expirationReview: "Review only after an authoritative integration exists", conflictIds: [] }),
  memory({ id: "mem-human-review", insight: "High-risk policy coverage requires a human evidence gate.", category: "STRATEGIC_INSIGHT", evidence: [memoryEvidence("me-decision", "STRATEGY", "dec-003", "Phase 4 decision requires research approval before pilot design.", 82)], observationPeriod: "Phase 4 strategy review", confidence: confidence(82, "Simulated decision evidence"), sampleSize: null, lastObserved: "2026-08-19T09:45:00.000Z", applicability: ["strat-policy-brief", "CONTENT"], trustState: "ACTIVE", freshness: "CURRENT", reviewStatus: "SIMULATED_REVIEWED", expirationReview: "Review before each policy briefing cycle", conflictIds: [] }),
  memory({ id: "mem-run-learning", insight: "Approval gates expose blocked external steps before simulated progression.", category: "AGENT_LEARNING", evidence: [memoryEvidence("me-run", "RUN_SIMULATION", "run-ai-literacy", "The run simulation pauses at publishing and provider gates.", 92)], observationPeriod: "One deterministic run simulation", confidence: confidence(92, "Deterministic run-state inspection"), sampleSize: 1, lastObserved: "2026-08-19T10:10:00.000Z", applicability: ["WORKFORCE", "PUBLISHING"], trustState: "SIMULATED", freshness: "CURRENT", reviewStatus: "NOT_REVIEWED", expirationReview: "Simulation-only record", conflictIds: [] }),
  memory({ id: "mem-archived-cost", insight: "Legacy provider totals cannot be treated as authoritative billing.", category: "OBSERVATION", evidence: [memoryEvidence("me-cost", "ANALYTICS", "metric-unit-economics", "Actual cost and ROI inputs remain unavailable.", 100)], observationPeriod: "Repository-state observation", confidence: confidence(100, "Financial boundary evidence", "evidence"), sampleSize: null, lastObserved: "2026-08-19T09:50:00.000Z", applicability: ["AI_ECONOMICS"], trustState: "ARCHIVED", freshness: "ARCHIVED", reviewStatus: "SIMULATED_REVIEWED", expirationReview: "Archived until billing authority exists", conflictIds: [] }),
];

const scenarios: ScenarioRecord[] = [
  { id: "scenario-baseline", name: "Baseline editorial cadence", mode: "BASELINE", baselineScenarioId: null, variables: [{ label: "Publishing frequency", value: "3 prepared briefs/week", provenance: simulated }, { label: "Model mix", value: "Balanced simulated catalog", provenance: estimated }], assumptions: ["No paid distribution", "No provider publishing", "Human review remains mandatory"], expectedImpact: "Maintain review quality while exposing workflow constraints.", projection: { audience: { minimum: 66, maximum: 74, unit: "index" }, cost: { minimum: 42, maximum: 58, unit: "USD" }, revenue: { value: null, label: "UNAVAILABLE", provenance: unavailable }, engagement: { minimum: 58, maximum: 68, unit: "index" }, reach: { minimum: 60, maximum: 72, unit: "index" }, roi: { value: null, label: "UNAVAILABLE", provenance: unavailable } }, qualityScore: 78, confidence: confidence(76, "Baseline deterministic assumptions"), risk: "LOW", riskRationale: "Low operational scope; outcome telemetry remains unavailable.", timeHorizonDays: 30, tradeOffs: ["Moderate preparation cost", "No external reach assumed"], optimizationCriterion: "Review stability", dataSourceLabel: "Phase 2–4 deterministic fixtures", provenance: simulated, executionReality: "SIMULATED" },
  { id: "scenario-quality", name: "High-quality evidence depth", mode: "HIGH_QUALITY", baselineScenarioId: "scenario-baseline", variables: [{ label: "Research depth", value: "+40% simulated token budget", provenance: estimated }, { label: "Verification", value: "Two modeled review passes", provenance: simulated }], assumptions: ["Longer preparation windows", "Higher-quality model candidate", "No revenue assumption"], expectedImpact: "Increase modeled evidence and editorial quality.", projection: { audience: { minimum: 68, maximum: 79, unit: "index" }, cost: { minimum: 78, maximum: 104, unit: "USD" }, revenue: { value: null, label: "UNAVAILABLE", provenance: unavailable }, engagement: { minimum: 60, maximum: 75, unit: "index" }, reach: { minimum: 58, maximum: 72, unit: "index" }, roi: { value: null, label: "UNAVAILABLE", provenance: unavailable } }, qualityScore: 92, confidence: confidence(70, "Quality assumptions without observed outcomes"), risk: "MEDIUM", riskRationale: "Higher estimated cost and slower preparation may not produce measured benefit.", timeHorizonDays: 30, tradeOffs: ["Highest estimated quality", "Highest estimated AI cost", "Slower simulated latency"], optimizationCriterion: "Modeled evidence quality", dataSourceLabel: "Phase 4 task graph + estimated model rates", provenance: simulated, executionReality: "SIMULATED" },
  { id: "scenario-balanced", name: "Balanced quality and cost", mode: "BALANCED", baselineScenarioId: "scenario-baseline", variables: [{ label: "Model routing", value: "Capability threshold then lower estimated cost", provenance: estimated }, { label: "Cadence", value: "3 prepared briefs/week", provenance: simulated }], assumptions: ["Quality threshold 80", "No actual provider routing", "Human approval at every gate"], expectedImpact: "Balance modeled quality, latency, and estimated cost.", projection: { audience: { minimum: 67, maximum: 77, unit: "index" }, cost: { minimum: 52, maximum: 72, unit: "USD" }, revenue: { value: null, label: "UNAVAILABLE", provenance: unavailable }, engagement: { minimum: 59, maximum: 72, unit: "index" }, reach: { minimum: 61, maximum: 75, unit: "index" }, roi: { value: null, label: "UNAVAILABLE", provenance: unavailable } }, qualityScore: 85, confidence: confidence(74, "Balanced deterministic trade-off assumptions"), risk: "LOW", riskRationale: "No actual quality or cost telemetry validates the balance.", timeHorizonDays: 30, tradeOffs: ["Moderate estimated cost", "Quality below high-quality scenario", "No provider effect"], optimizationCriterion: "Quality threshold at lower estimated cost", dataSourceLabel: "Phase 4 task graph + estimated model rates", provenance: simulated, executionReality: "SIMULATED" },
  { id: "scenario-low-cost", name: "Low-cost preparation", mode: "LOW_COST", baselineScenarioId: "scenario-baseline", variables: [{ label: "Model mix", value: "Fast catalog candidates", provenance: estimated }, { label: "Research depth", value: "Reduced simulated context", provenance: simulated }], assumptions: ["Lower context depth", "One review pass", "No actual savings claim"], expectedImpact: "Reduce estimated AI preparation cost with a modeled quality trade-off.", projection: { audience: { minimum: 61, maximum: 72, unit: "index" }, cost: { minimum: 24, maximum: 39, unit: "USD" }, revenue: { value: null, label: "UNAVAILABLE", provenance: unavailable }, engagement: { minimum: 53, maximum: 66, unit: "index" }, reach: { minimum: 59, maximum: 73, unit: "index" }, roi: { value: null, label: "UNAVAILABLE", provenance: unavailable } }, qualityScore: 71, confidence: confidence(66, "Reduced-context assumptions increase uncertainty"), risk: "MEDIUM", riskRationale: "Lower modeled quality may weaken evidence context.", timeHorizonDays: 30, tradeOffs: ["Lowest estimated cost", "Lower modeled quality", "Greater evidence-compression risk"], optimizationCriterion: "Minimum estimated cost subject to review", dataSourceLabel: "Estimated model rates only", provenance: simulated, executionReality: "SIMULATED" },
];

const candidateSeeds: Phase5ExperienceFixture["modelCandidates"] = [
  { modelId: "gemini-pro-demo", estimatedInputRatePerMillion: 1.25, estimatedOutputRatePerMillion: 5, estimatedQuality: 91, latencyClass: "STANDARD", provenance: estimated, executionReality: "ESTIMATED" },
  { modelId: "gemini-flash-demo", estimatedInputRatePerMillion: 0.2, estimatedOutputRatePerMillion: 0.8, estimatedQuality: 80, latencyClass: "FAST", provenance: estimated, executionReality: "ESTIMATED" },
  { modelId: "gpt-reasoning-demo", estimatedInputRatePerMillion: 3, estimatedOutputRatePerMillion: 12, estimatedQuality: 94, latencyClass: "DELIBERATE", provenance: estimated, executionReality: "ESTIMATED" },
  { modelId: "gpt-fast-demo", estimatedInputRatePerMillion: 0.4, estimatedOutputRatePerMillion: 1.6, estimatedQuality: 82, latencyClass: "FAST", provenance: estimated, executionReality: "ESTIMATED" },
  { modelId: "claude-demo", estimatedInputRatePerMillion: 0, estimatedOutputRatePerMillion: 0, estimatedQuality: 0, latencyClass: "STANDARD", provenance: unavailable, executionReality: "UNAVAILABLE" },
];
const costFor = (modelId: string, input: number, output: number) => {
  const model = candidateSeeds.find((item) => item.modelId === modelId);
  return Number((((input / 1_000_000) * (model?.estimatedInputRatePerMillion ?? 0)) + ((output / 1_000_000) * (model?.estimatedOutputRatePerMillion ?? 0))).toFixed(4));
};
const routing = (
  id: string,
  taskId: string,
  taskLabel: string,
  complexity: ModelRoutingSimulation["complexity"],
  input: number,
  output: number,
  candidateModelIds: string[],
  selectedModelId: string,
  reason: string,
): ModelRoutingSimulation => {
  const selected = candidateSeeds.find((item) => item.modelId === selectedModelId);
  return { id, taskId, taskLabel, complexity, estimatedInputTokens: input, estimatedOutputTokens: output, candidateModelIds, selectedModelId, estimatedCost: costFor(selectedModelId, input, output), expectedQuality: selected?.estimatedQuality ?? 0, latencyClass: selected?.latencyClass ?? "STANDARD", reason, tradeOff: "Selection exists only in simulation and cannot change provider behavior.", confidence: confidence(72, "Estimated catalog rates and heuristic quality"), provenance: estimated, executionReality: "SIMULATED" };
};
const routingSimulations: ModelRoutingSimulation[] = [
  routing("route-01", "tsk-ai-01", "Evidence synthesis", "HIGH", 140000, 28000, ["gemini-pro-demo", "gpt-reasoning-demo", "gpt-fast-demo"], "gemini-pro-demo", "Estimated quality clears the evidence threshold at lower estimated cost than the deliberate candidate."),
  routing("route-02", "tsk-ai-02", "Editorial architecture", "MEDIUM", 90000, 18000, ["gemini-flash-demo", "gpt-fast-demo", "gemini-pro-demo"], "gpt-fast-demo", "Balanced fast candidate selected in simulation for editorial structure."),
  routing("route-03", "tsk-policy-01", "Policy question mapping", "HIGH", 180000, 36000, ["gpt-reasoning-demo", "gemini-pro-demo"], "gpt-reasoning-demo", "Highest estimated quality selected for high-risk policy analysis."),
  routing("route-04", "tsk-visual-01", "Visual storyboard preparation", "MEDIUM", 72000, 16000, ["gemini-flash-demo", "gpt-fast-demo"], "gemini-flash-demo", "Fast multimodal catalog candidate meets the simulated quality threshold."),
  routing("route-05", "tsk-policy-05", "Measurement specification", "MEDIUM", 110000, 22000, ["gemini-pro-demo", "gpt-fast-demo"], "gemini-pro-demo", "Higher estimated analytical quality is prioritized for measurement design."),
];
const taskAgents: Record<string, Agent["id"][]> = {
  "tsk-ai-01": ["AGT-001", "AGT-002", "AGT-003"],
  "tsk-ai-02": ["AGT-004", "AGT-005", "AGT-006", "AGT-007"],
  "tsk-policy-01": ["AGT-001", "AGT-003", "AGT-020"],
  "tsk-visual-01": ["AGT-007", "AGT-013", "AGT-018"],
  "tsk-policy-05": ["AGT-017", "AGT-018", "AGT-019", "AGT-020"],
};
const taskCosts: TaskCostEstimate[] = routingSimulations.map((item) => ({
  id: `cost-${item.id}`,
  taskId: item.taskId,
  agentIds: taskAgents[item.taskId] ?? [],
  modelId: item.selectedModelId,
  taskType: item.taskLabel,
  estimatedInputTokens: item.estimatedInputTokens,
  estimatedOutputTokens: item.estimatedOutputTokens,
  estimatedCost: item.estimatedCost,
  estimatedQuality: item.expectedQuality,
  latencyClass: item.latencyClass,
  confidence: item.confidence,
  costSource: "Illustrative catalog rates — not provider pricing",
  provenance: estimated,
  executionReality: "ESTIMATED",
}));

const costAwareStrategies: CostAwareStrategyOption[] = [
  ["strat-ai-literacy", "HIGH_QUALITY", 104, 89, 93, "MEDIUM", 70, "Prioritize modeled evidence quality"],
  ["strat-ai-literacy", "BALANCED", 68, 84, 85, "LOW", 75, "Meet quality threshold at lower estimate"],
  ["strat-ai-literacy", "LOW_COST", 36, 75, 72, "MEDIUM", 65, "Minimize estimated cost subject to review"],
  ["strat-policy-brief", "HIGH_QUALITY", 126, 86, 95, "MEDIUM", 68, "Prioritize policy-analysis quality"],
  ["strat-policy-brief", "BALANCED", 82, 80, 87, "MEDIUM", 72, "Balance evidence quality and cost"],
  ["strat-policy-brief", "LOW_COST", 44, 68, 70, "HIGH", 60, "Minimize estimate despite quality risk"],
  ["strat-founder-visual", "HIGH_QUALITY", 88, 82, 90, "MEDIUM", 67, "Prioritize visual and evidence quality"],
  ["strat-founder-visual", "BALANCED", 57, 77, 84, "LOW", 73, "Balance visual preparation and estimate"],
  ["strat-founder-visual", "LOW_COST", 29, 66, 69, "MEDIUM", 61, "Minimize estimate with compression risk"],
].map(([strategyId, mode, aiCost, impact, quality, optionRisk, score, criterion], index) => ({
  id: `strategy-econ-${index + 1}`,
  strategyId: strategyId as string,
  mode: mode as CostAwareStrategyOption["mode"],
  estimatedAICost: aiCost as number,
  expectedImpactScore: impact as number,
  qualityScore: quality as number,
  risk: optionRisk as CostAwareStrategyOption["risk"],
  confidence: confidence(score as number, "Simulated strategy/economics trade-off model", "estimate"),
  tradeOffs: mode === "HIGH_QUALITY" ? ["Higher estimated cost", "Slower latency class"] : mode === "LOW_COST" ? ["Lower quality estimate", "Greater review risk"] : ["Moderate estimate", "Quality threshold assumption"],
  optimizationCriterion: criterion as string,
  provenance: estimated,
  executionReality: "ESTIMATED" as const,
}));
const budgetPlans: BudgetSimulationPlan[] = [
  { id: "budget-lean", label: "Lean simulation", budget: 50, estimatedTasks: 42, estimatedModelMix: [{ modelId: "gemini-flash-demo", percent: 70 }, { modelId: "gpt-fast-demo", percent: 30 }], estimatedCost: 38, expectedImpactScore: 68, risk: "MEDIUM", confidence: confidence(64, "Low-cost model-mix assumptions", "estimate"), provenance: estimated, executionReality: "SIMULATED" },
  { id: "budget-balanced", label: "Balanced simulation", budget: 90, estimatedTasks: 56, estimatedModelMix: [{ modelId: "gemini-flash-demo", percent: 35 }, { modelId: "gpt-fast-demo", percent: 35 }, { modelId: "gemini-pro-demo", percent: 30 }], estimatedCost: 72, expectedImpactScore: 81, risk: "LOW", confidence: confidence(73, "Balanced model-mix assumptions", "estimate"), provenance: estimated, executionReality: "SIMULATED" },
  { id: "budget-quality", label: "Quality simulation", budget: 150, estimatedTasks: 62, estimatedModelMix: [{ modelId: "gemini-pro-demo", percent: 55 }, { modelId: "gpt-reasoning-demo", percent: 25 }, { modelId: "gpt-fast-demo", percent: 20 }], estimatedCost: 128, expectedImpactScore: 88, risk: "MEDIUM", confidence: confidence(69, "High-quality model-mix assumptions", "estimate"), provenance: estimated, executionReality: "SIMULATED" },
];

export const phase5ExperienceFixture: Phase5ExperienceFixture = {
  architectureVersion: "phase-5-autonomy-memory-economics-v1",
  levelDefinitions,
  autonomyDomains,
  approvalPolicies,
  runs: [
    { id: "run-ai-literacy", objective: "Simulate preparation of the Practical AI Literacy strategy.", strategyId: "strat-ai-literacy", initiativeId: "init-ai-evidence", taskIds: ["tsk-ai-01", "tsk-ai-02", "tsk-ai-03"], agentIds: ["AGT-001", "AGT-002", "AGT-003", "AGT-004", "AGT-005", "AGT-008", "AGT-010"], state: "SIMULATING", currentStage: "PREPARE", progress: 58, estimatedBudget: budget(75, "Simulated run ceiling"), estimatedCost: 48, risk: risk("MEDIUM", "Evidence and editorial outputs require human review."), approvalGates: [{ id: "gate-ai-review", label: "Editorial evidence review", state: "PENDING", reason: "Human review required before downstream simulation.", provenance: simulated, executionReality: "SIMULATED" }], interventionPoints: ["Confidence below 75", "Risk becomes HIGH", "Any external-action intent"], outcome: "Simulation in progress; no artifact executed or published.", provenance: simulated, executionReality: "SIMULATED" },
    { id: "run-policy-brief", objective: "Simulate the policy research and verification sequence.", strategyId: "strat-policy-brief", initiativeId: "init-policy-research", taskIds: ["tsk-policy-01", "tsk-policy-02", "tsk-policy-03"], agentIds: ["AGT-001", "AGT-003", "AGT-008", "AGT-010", "AGT-012", "AGT-020"], state: "WAITING_APPROVAL", currentStage: "APPROVAL", progress: 41, estimatedBudget: budget(110, "Simulated high-risk research ceiling"), estimatedCost: 67, risk: risk("HIGH", "Policy accuracy requires authoritative source review."), approvalGates: [{ id: "gate-policy-source", label: "Source authority review", state: "PENDING", reason: "No authoritative policy source integration exists.", provenance: simulated, executionReality: "SIMULATED" }, { id: "gate-policy-risk", label: "High-risk content review", state: "BLOCKED", reason: "Backend policy enforcement unavailable.", provenance: unavailable, executionReality: "SIMULATED" }], interventionPoints: ["Unverified policy claim", "Conflicting evidence", "High-risk classification"], outcome: "Paused at a simulated approval gate.", provenance: simulated, executionReality: "SIMULATED" },
    { id: "run-visual-prototype", objective: "Simulate a founder visual briefing prototype.", strategyId: "strat-founder-visual", initiativeId: "init-visual-format", taskIds: ["tsk-visual-01", "tsk-visual-02", "tsk-visual-03"], agentIds: ["AGT-005", "AGT-007", "AGT-010", "AGT-013", "AGT-017", "AGT-018", "AGT-019"], state: "COMPLETED", currentStage: "SIMULATED_RESULT", progress: 100, estimatedBudget: budget(60, "Simulated prototype ceiling"), estimatedCost: 39, risk: risk("MEDIUM", "Visual compression may weaken evidence context."), approvalGates: [{ id: "gate-visual", label: "Visual evidence context review", state: "SIMULATED_APPROVED", reason: "Approved in simulation only.", provenance: simulated, executionReality: "SIMULATED" }], interventionPoints: ["Evidence context below threshold", "Audience conflict unresolved"], outcome: "Simulated storyboard and review notes produced; nothing executed externally.", provenance: simulated, executionReality: "SIMULATED" },
  ],
  memories,
  memoryConflicts: [{ id: "conf-video", memoryIds: ["mem-video-positive", "mem-video-negative"], reason: "Modeled format affinity conflicts with modeled evidence-comprehension risk.", evidenceComparison: "Audience affinity and content-quality heuristics answer different questions and cannot be silently merged.", observationPeriods: ["Modeled 30-day audience window", "Modeled content-quality window"], resolutionStatus: "NEEDS_REVIEW", provenance: simulated, executionReality: "SIMULATED" }],
  scenarios,
  modelCandidates: candidateSeeds,
  routingSimulations,
  taskCosts,
  costAwareStrategies,
  budgetPlans,
  killSwitch: { state: "ARMED", backendEnforcement: "UNAVAILABLE", disclosure: "Simulation only — no backend execution is affected.", provenance: unavailable, executionReality: "SIMULATED" },
  autonomyAudit: [
    { id: "audit-auto-01", action: "CONFIGURE_LEVEL", target: "CONTENT", actor: "Demo autonomy reviewer", timestamp: "2026-08-19T11:00:00.000Z", previousState: "LEVEL_1", resultingState: "LEVEL_2_SIMULATED", reason: "Demonstrate preparation policy.", provenance: simulated, executionReality: "SIMULATED" },
    { id: "audit-auto-02", action: "REQUIRE_APPROVAL", target: "PUBLISHING", actor: "Demo autonomy reviewer", timestamp: "2026-08-19T11:08:00.000Z", previousState: "DISABLED", resultingState: "APPROVAL_REQUIRED_SIMULATED", reason: "Preserve external execution boundary.", provenance: simulated, executionReality: "SIMULATED" },
    { id: "audit-auto-03", action: "PAUSE_RUN", target: "run-policy-brief", actor: "Demo autonomy reviewer", timestamp: "2026-08-19T11:16:00.000Z", previousState: "SIMULATING", resultingState: "WAITING_APPROVAL", reason: "High-risk source review gate.", provenance: simulated, executionReality: "SIMULATED" },
    { id: "audit-auto-04", action: "REVIEW_MEMORY", target: "mem-video-positive", actor: "Demo autonomy reviewer", timestamp: "2026-08-19T11:24:00.000Z", previousState: "ACTIVE", resultingState: "CONTRADICTED", reason: "Conflicting content-quality learning surfaced.", provenance: simulated, executionReality: "SIMULATED" },
    { id: "audit-auto-05", action: "SELECT_SCENARIO", target: "scenario-balanced", actor: "Demo autonomy reviewer", timestamp: "2026-08-19T11:32:00.000Z", previousState: "BASELINE", resultingState: "BALANCED_SIMULATION", reason: "Compare quality/cost trade-off only.", provenance: simulated, executionReality: "SIMULATED" },
    { id: "audit-auto-06", action: "ARM_KILL_SWITCH", target: "AUTONOMY_SIMULATION", actor: "Demo autonomy reviewer", timestamp: "2026-08-19T11:40:00.000Z", previousState: "UNAVAILABLE", resultingState: "ARMED_SIMULATION", reason: "Demonstrate deliberate emergency-control UX.", provenance: simulated, executionReality: "SIMULATED" },
  ],
  overrideHistory: strategyDirectorFixture.overrideHistory,
  financialTruth: {
    actualCost: { value: null, label: "UNAVAILABLE", provenance: unavailable },
    actualRevenue: { value: null, label: "UNAVAILABLE", provenance: unavailable },
    verifiedRoi: { value: null, label: "UNAVAILABLE", provenance: unavailable },
    estimatedRoi: { value: null, label: "UNAVAILABLE", inputs: ["Authoritative cost", "Attributed incremental revenue"], assumptions: ["No causal revenue model exists", "No billing authority exists"], costSource: "Estimated model only", revenueSource: "Unavailable", confidence: confidence(100, "Inputs are explicitly unavailable", "evidence"), provenance: unavailable, executionReality: "UNAVAILABLE" },
  },
  provenance: simulated,
};
