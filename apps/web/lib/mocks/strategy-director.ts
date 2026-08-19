import { createDataProvenance } from "@/types/data-state";
import type {
  DecisionDomain,
  DecisionPriority,
  DecisionType,
  StrategyDirectorDecision,
  StrategyDirectorFixture,
  StrategyDirectorInitiative,
  StrategyDirectorPlan,
  StrategyEvidence,
  StrategyRiskLevel,
  StrategyTask,
} from "@/types/strategy-director";

const provenance = createDataProvenance(
  "mock",
  "Phase 4 deterministic strategy projection",
  "Simulated recommendations, assignments, costs, risks, decisions, timelines, and outputs. No strategy or agent execution occurred.",
);
const unavailable = createDataProvenance(
  "unavailable",
  "Execution runtime unavailable",
  "No orchestration, task dispatch, approval, override, provider, publishing, risk, or cost backend is connected.",
);
const confidence = (score: number, basis: string) => ({
  score,
  basis,
  kind: "model" as const,
});
const cost = (amount: number, basis = "Simulated planning estimate") => ({
  amount,
  currency: "USD",
  basis,
  provenance,
});
const risk = (level: StrategyRiskLevel, rationale: string) => ({
  level,
  rationale,
  truth: "SIMULATED" as const,
  provenance,
});
const impact = (label: string, minimum: number, maximum: number) => ({
  label,
  value: null,
  unit: "score" as const,
  range: { minimum, maximum },
  provenance,
});
const evidence = (
  id: string,
  signal: string,
  observation: string,
  score: number,
  source: StrategyEvidence["source"] = "Simulated Growth Intelligence",
): StrategyEvidence => ({
  id,
  label: signal,
  detail: observation,
  source,
  signal,
  observation,
  timestamp: "2026-08-19T09:00:00.000Z",
  confidence: confidence(score, "Deterministic cross-domain fixture agreement"),
  simulated: true,
  provenance,
});
const evidenceById = {
  "ev-ai-demand": evidence(
    "ev-ai-demand",
    "Practical AI demand",
    "Phase 2 models accelerating interest in applied-AI explainers.",
    89,
  ),
  "ev-ai-gap": evidence(
    "ev-ai-gap",
    "Coverage gap",
    "Phase 2 models a material gap between audience demand and current coverage.",
    86,
  ),
  "ev-fintech": evidence(
    "ev-fintech",
    "Fintech policy signal",
    "Phase 2 models fragmented regional policy coverage for founders and investors.",
    82,
  ),
  "ev-video": evidence(
    "ev-video",
    "Visual-format affinity",
    "Phase 2 synthetic cohorts indicate stronger affinity for concise visual briefings.",
    79,
  ),
  "phase3-distribution": evidence(
    "phase3-distribution",
    "Distribution boundary",
    "Phase 3 exposes eleven structural platform templates and zero verified provider connections.",
    100,
    "Phase 3 experience contract",
  ),
  "phase3-analytics": evidence(
    "phase3-analytics",
    "Measurement authority",
    "Phase 3 separates observed, estimated, attributed, forecast, simulated, and unavailable states.",
    100,
    "Phase 3 experience contract",
  ),
  "phase3-experiment": evidence(
    "phase3-experiment",
    "Experiment integrity",
    "The completed Phase 3 experiment fixture remains explicitly inconclusive.",
    100,
    "Phase 3 experience contract",
  ),
} as const;

type TaskSeed = Omit<
  StrategyTask,
  "estimatedCost" | "risk" | "confidence" | "provenance"
> & {
  costAmount: number;
  riskLevel: StrategyRiskLevel;
  riskRationale: string;
  confidenceScore: number;
};
function task(seed: TaskSeed): StrategyTask {
  const {
    costAmount,
    riskLevel,
    riskRationale,
    confidenceScore,
    ...record
  } = seed;
  return {
    ...record,
    estimatedCost: cost(costAmount, "Simulated task effort estimate"),
    risk: risk(riskLevel, riskRationale),
    confidence: confidence(
      confidenceScore,
      "Task readiness based on deterministic dependency projection",
    ),
    provenance,
  };
}

type InitiativeSeed = Omit<
  StrategyDirectorInitiative,
  | "estimatedCost"
  | "risk"
  | "confidence"
  | "progress"
  | "responsibleAgentIds"
  | "provenance"
> & {
  riskLevel: StrategyRiskLevel;
  riskRationale: string;
  confidenceScore: number;
};
function initiative(seed: InitiativeSeed): StrategyDirectorInitiative {
  const {
    riskLevel,
    riskRationale,
    confidenceScore,
    tasks,
    ...record
  } = seed;
  const amount = tasks.reduce(
    (total, item) => total + (item.estimatedCost.amount ?? 0),
    0,
  );
  const progress = Math.round(
    tasks.reduce((total, item) => total + item.progress, 0) / tasks.length,
  );
  return {
    ...record,
    tasks,
    progress,
    responsibleAgentIds: [...new Set(tasks.flatMap((item) => item.agentIds))],
    estimatedCost: cost(amount, "Sum of simulated task estimates"),
    risk: risk(riskLevel, riskRationale),
    confidence: confidence(
      confidenceScore,
      "Initiative confidence aggregates simulated task and evidence readiness",
    ),
    provenance,
  };
}

const s1i1Tasks: StrategyTask[] = [
  task({ id: "tsk-ai-01", strategyId: "strat-ai-literacy", initiativeId: "init-ai-evidence", title: "Synthesize demand and gap evidence", objective: "Create a reviewable evidence brief from Phase 2 signals.", status: "COMPLETED", progress: 100, agentIds: ["AGT-001", "AGT-002", "AGT-003"], dependencyTaskIds: [], outputs: ["Simulated evidence synthesis"], review: "APPROVED", costAmount: 1200, riskLevel: "LOW", riskRationale: "Uses existing simulated evidence with no external action.", confidenceScore: 91, startDay: 1, durationDays: 3, executionReality: "SIMULATED" }),
  task({ id: "tsk-ai-02", strategyId: "strat-ai-literacy", initiativeId: "init-ai-evidence", title: "Draft six-part editorial architecture", objective: "Translate the evidence brief into a human-reviewable series structure.", status: "WORKING", progress: 64, agentIds: ["AGT-004", "AGT-005", "AGT-006", "AGT-007"], dependencyTaskIds: ["tsk-ai-01"], outputs: ["Simulated series outline", "Simulated visual treatment"], review: "IN_REVIEW", costAmount: 1600, riskLevel: "MEDIUM", riskRationale: "Editorial framing may overstate modeled demand without careful disclosure.", confidenceScore: 84, startDay: 4, durationDays: 5, executionReality: "SIMULATED" }),
  task({ id: "tsk-ai-03", strategyId: "strat-ai-literacy", initiativeId: "init-ai-evidence", title: "Verify claims, originality, safety, and bias", objective: "Model a complete editorial review gate before adaptation.", status: "WAITING_APPROVAL", progress: 42, agentIds: ["AGT-008", "AGT-009", "AGT-010", "AGT-011", "AGT-012"], dependencyTaskIds: ["tsk-ai-02"], outputs: ["Simulated review checklist"], review: "PENDING", costAmount: 800, riskLevel: "LOW", riskRationale: "Review is simulated and cannot approve real publication.", confidenceScore: 88, startDay: 9, durationDays: 3, executionReality: "SIMULATED" }),
];
const s1i2Tasks: StrategyTask[] = [
  task({ id: "tsk-ai-04", strategyId: "strat-ai-literacy", initiativeId: "init-ai-distribution", title: "Prepare platform adaptations", objective: "Model approved-format adaptations for selected Phase 3 destinations.", status: "PLANNED", progress: 20, agentIds: ["AGT-013", "AGT-015"], dependencyTaskIds: ["tsk-ai-03"], outputs: ["Planned structural previews"], review: "PENDING", costAmount: 900, riskLevel: "MEDIUM", riskRationale: "No provider fidelity or account authorization exists.", confidenceScore: 80, startDay: 12, durationDays: 5, executionReality: "PLANNED" }),
  task({ id: "tsk-ai-05", strategyId: "strat-ai-literacy", initiativeId: "init-ai-distribution", title: "Model schedule and community review", objective: "Prepare a manual review sequence without dispatching content.", status: "BLOCKED", progress: 10, agentIds: ["AGT-014", "AGT-016", "AGT-028"], dependencyTaskIds: ["tsk-ai-04"], outputs: ["Simulated approval checklist"], review: "CHANGES_REQUESTED", costAmount: 600, riskLevel: "HIGH", riskRationale: "Publishing, consent, and provider authorization are unavailable.", confidenceScore: 75, startDay: 17, durationDays: 4, executionReality: "UNAVAILABLE" }),
  task({ id: "tsk-ai-06", strategyId: "strat-ai-literacy", initiativeId: "init-ai-distribution", title: "Define measurement and optimization questions", objective: "Specify success signals without claiming observed performance.", status: "PLANNED", progress: 15, agentIds: ["AGT-017", "AGT-018", "AGT-019"], dependencyTaskIds: ["tsk-ai-05"], outputs: ["Planned measurement specification"], review: "PENDING", costAmount: 900, riskLevel: "MEDIUM", riskRationale: "Audience and performance backends remain unavailable.", confidenceScore: 78, startDay: 21, durationDays: 5, executionReality: "PLANNED" }),
];
const s2i1Tasks: StrategyTask[] = [
  task({ id: "tsk-policy-01", strategyId: "strat-policy-brief", initiativeId: "init-policy-research", title: "Map regional policy questions", objective: "Organize modeled policy demand into a research agenda.", status: "WORKING", progress: 58, agentIds: ["AGT-001", "AGT-003", "AGT-020"], dependencyTaskIds: [], outputs: ["Simulated policy question map"], review: "IN_REVIEW", costAmount: 1400, riskLevel: "MEDIUM", riskRationale: "Synthetic competitor and policy signals require human source validation.", confidenceScore: 81, startDay: 2, durationDays: 5, executionReality: "SIMULATED" }),
  task({ id: "tsk-policy-02", strategyId: "strat-policy-brief", initiativeId: "init-policy-research", title: "Design weekly briefing format", objective: "Create an editorial specification for a four-week pilot.", status: "PLANNED", progress: 30, agentIds: ["AGT-002", "AGT-004", "AGT-005"], dependencyTaskIds: ["tsk-policy-01"], outputs: ["Planned briefing format"], review: "PENDING", costAmount: 1800, riskLevel: "MEDIUM", riskRationale: "The proposed cadence may exceed available editorial capacity.", confidenceScore: 79, startDay: 7, durationDays: 6, executionReality: "PLANNED" }),
  task({ id: "tsk-policy-03", strategyId: "strat-policy-brief", initiativeId: "init-policy-research", title: "Create evidence and quality gate", objective: "Model source, quality, and bias checks for policy claims.", status: "PLANNED", progress: 20, agentIds: ["AGT-008", "AGT-010", "AGT-012"], dependencyTaskIds: ["tsk-policy-02"], outputs: ["Planned evidence gate"], review: "PENDING", costAmount: 1000, riskLevel: "HIGH", riskRationale: "Policy errors could create material editorial trust risk.", confidenceScore: 86, startDay: 13, durationDays: 4, executionReality: "PLANNED" }),
];
const s2i2Tasks: StrategyTask[] = [
  task({ id: "tsk-policy-04", strategyId: "strat-policy-brief", initiativeId: "init-policy-pilot", title: "Adapt pilot for four channels", objective: "Compare structural versions without publishing.", status: "PLANNED", progress: 10, agentIds: ["AGT-013", "AGT-014", "AGT-015", "AGT-016"], dependencyTaskIds: ["tsk-policy-03"], outputs: ["Planned channel comparison"], review: "PENDING", costAmount: 1200, riskLevel: "HIGH", riskRationale: "No account, OAuth, or provider execution exists.", confidenceScore: 74, startDay: 17, durationDays: 5, executionReality: "PLANNED" }),
  task({ id: "tsk-policy-05", strategyId: "strat-policy-brief", initiativeId: "init-policy-pilot", title: "Specify experiment and analytics contract", objective: "Define a falsifiable simulated pilot without causal claims.", status: "PLANNED", progress: 12, agentIds: ["AGT-017", "AGT-018", "AGT-019", "AGT-020"], dependencyTaskIds: ["tsk-policy-04"], outputs: ["Planned experiment specification"], review: "PENDING", costAmount: 1400, riskLevel: "MEDIUM", riskRationale: "No governed event stream or audience assignment exists.", confidenceScore: 76, startDay: 22, durationDays: 5, executionReality: "PLANNED" }),
  task({ id: "tsk-policy-06", strategyId: "strat-policy-brief", initiativeId: "init-policy-pilot", title: "Review sequencing and compliance", objective: "Model orchestration dependencies and compliance review only.", status: "WAITING_APPROVAL", progress: 24, agentIds: ["AGT-025", "AGT-026"], dependencyTaskIds: ["tsk-policy-05"], outputs: ["Simulated dependency review"], review: "PENDING", costAmount: 800, riskLevel: "LOW", riskRationale: "No actual orchestration or enforcement is performed.", confidenceScore: 83, startDay: 27, durationDays: 3, executionReality: "SIMULATED" }),
];
const s3i1Tasks: StrategyTask[] = [
  task({ id: "tsk-visual-01", strategyId: "strat-founder-visual", initiativeId: "init-visual-format", title: "Model founder visual format", objective: "Translate audience affinity into a three-episode storyboard preview.", status: "WORKING", progress: 47, agentIds: ["AGT-007", "AGT-013", "AGT-018"], dependencyTaskIds: [], outputs: ["Simulated storyboard preview"], review: "IN_REVIEW", costAmount: 900, riskLevel: "LOW", riskRationale: "Output remains a local preview and does not publish.", confidenceScore: 80, startDay: 3, durationDays: 5, executionReality: "SIMULATED" }),
  task({ id: "tsk-visual-02", strategyId: "strat-founder-visual", initiativeId: "init-visual-format", title: "Review editorial quality and compliance", objective: "Model quality and ethics review for visual claims.", status: "WAITING_APPROVAL", progress: 35, agentIds: ["AGT-005", "AGT-010", "AGT-028"], dependencyTaskIds: ["tsk-visual-01"], outputs: ["Simulated visual review notes"], review: "PENDING", costAmount: 700, riskLevel: "MEDIUM", riskRationale: "Visual compression may remove evidence context.", confidenceScore: 82, startDay: 8, durationDays: 3, executionReality: "SIMULATED" }),
  task({ id: "tsk-visual-03", strategyId: "strat-founder-visual", initiativeId: "init-visual-format", title: "Define audience measurement questions", objective: "Specify what would need to be measured before any optimization claim.", status: "PLANNED", progress: 18, agentIds: ["AGT-017", "AGT-019", "AGT-020"], dependencyTaskIds: ["tsk-visual-02"], outputs: ["Planned audience measurement questions"], review: "PENDING", costAmount: 800, riskLevel: "MEDIUM", riskRationale: "No observed audience telemetry supports optimization.", confidenceScore: 77, startDay: 11, durationDays: 4, executionReality: "PLANNED" }),
];
const s3i2Tasks: StrategyTask[] = [
  task({ id: "tsk-visual-04", strategyId: "strat-founder-visual", initiativeId: "init-visual-guardrails", title: "Define monetization evidence boundaries", objective: "List required evidence without modeling financial execution.", status: "BLOCKED", progress: 8, agentIds: ["AGT-021", "AGT-022", "AGT-023", "AGT-024"], dependencyTaskIds: ["tsk-visual-03"], outputs: ["Unavailable financial evidence checklist"], review: "CHANGES_REQUESTED", costAmount: 600, riskLevel: "HIGH", riskRationale: "Revenue, spend, ROI, and conversion data are unavailable.", confidenceScore: 100, startDay: 15, durationDays: 4, executionReality: "UNAVAILABLE" }),
  task({ id: "tsk-visual-05", strategyId: "strat-founder-visual", initiativeId: "init-visual-guardrails", title: "Model workforce dependency safety", objective: "Visualize sequencing, monitoring, and health dependencies.", status: "PLANNED", progress: 16, agentIds: ["AGT-025", "AGT-026", "AGT-027", "AGT-028"], dependencyTaskIds: ["tsk-visual-04"], outputs: ["Planned workforce dependency map"], review: "PENDING", costAmount: 600, riskLevel: "LOW", riskRationale: "The map cannot coordinate or interrupt real agents.", confidenceScore: 90, startDay: 19, durationDays: 5, executionReality: "PLANNED" }),
  task({ id: "tsk-visual-06", strategyId: "strat-founder-visual", initiativeId: "init-visual-guardrails", title: "Prepare human review language", objective: "Ensure hooks, safety, and bias disclosures stay explicit.", status: "PLANNED", progress: 12, agentIds: ["AGT-006", "AGT-011", "AGT-012"], dependencyTaskIds: ["tsk-visual-05"], outputs: ["Planned review language"], review: "PENDING", costAmount: 500, riskLevel: "MEDIUM", riskRationale: "A concise format may obscure uncertainty without disclosure.", confidenceScore: 85, startDay: 24, durationDays: 4, executionReality: "PLANNED" }),
];

const initiatives: StrategyDirectorInitiative[] = [
  initiative({ id: "init-ai-evidence", strategyId: "strat-ai-literacy", title: "Evidence-led AI editorial system", objective: "Turn the highest-priority Growth opportunity into a reviewed editorial architecture.", description: "Synthesize demand, structure a six-part series, and model complete editorial review.", status: "SIMULATING", opportunityIds: ["opp-ai-explainers"], expectedImpact: impact("Modeled qualified audience fit", 74, 88), timelineDays: 12, tasks: s1i1Tasks, dependencyInitiativeIds: [], riskLevel: "MEDIUM", riskRationale: "Demand and impact are modeled, not observed.", confidenceScore: 87, executionReality: "SIMULATED" }),
  initiative({ id: "init-ai-distribution", strategyId: "strat-ai-literacy", title: "Review-first distribution plan", objective: "Prepare channel structures and measurement questions without external delivery.", description: "Connect editorial review to Phase 3 adaptation, queue, and analytics boundaries.", status: "PLANNED", opportunityIds: ["opp-ai-explainers"], expectedImpact: impact("Modeled distribution readiness", 62, 79), timelineDays: 18, tasks: s1i2Tasks, dependencyInitiativeIds: ["init-ai-evidence"], riskLevel: "HIGH", riskRationale: "No provider, publishing, or audience integration exists.", confidenceScore: 78, executionReality: "PLANNED" }),
  initiative({ id: "init-policy-research", strategyId: "strat-policy-brief", title: "Regional policy evidence desk", objective: "Design the research and verification system for a weekly policy briefing.", description: "Map questions, format the briefing, and establish an evidence gate.", status: "IN_REVIEW", opportunityIds: ["opp-fintech-policy"], expectedImpact: impact("Modeled founder relevance", 68, 82), timelineDays: 17, tasks: s2i1Tasks, dependencyInitiativeIds: [], riskLevel: "HIGH", riskRationale: "Policy claims require authoritative human source review.", confidenceScore: 82, executionReality: "SIMULATED" }),
  initiative({ id: "init-policy-pilot", strategyId: "strat-policy-brief", title: "Four-week pilot specification", objective: "Prepare a reviewable cross-channel pilot and measurement contract.", description: "Model adaptation, experiment design, analytics, sequencing, and compliance.", status: "PLANNED", opportunityIds: ["opp-fintech-policy"], expectedImpact: impact("Modeled briefing validation", 58, 76), timelineDays: 13, tasks: s2i2Tasks, dependencyInitiativeIds: ["init-policy-research"], riskLevel: "HIGH", riskRationale: "Execution infrastructure and governed event assignment are unavailable.", confidenceScore: 74, executionReality: "PLANNED" }),
  initiative({ id: "init-visual-format", strategyId: "strat-founder-visual", title: "Founder visual briefing prototype", objective: "Create a three-episode structural prototype with review and measurement questions.", description: "Translate synthetic format affinity into a local storyboard and review specification.", status: "SIMULATING", opportunityIds: ["opp-creator-video"], expectedImpact: impact("Modeled visual-format fit", 65, 80), timelineDays: 15, tasks: s3i1Tasks, dependencyInitiativeIds: [], riskLevel: "MEDIUM", riskRationale: "Synthetic format affinity may not predict observed engagement.", confidenceScore: 79, executionReality: "SIMULATED" }),
  initiative({ id: "init-visual-guardrails", strategyId: "strat-founder-visual", title: "Workforce and evidence guardrails", objective: "Make financial, workforce, safety, and review boundaries explicit.", description: "Block unsupported economics, model dependencies, and preserve human review language.", status: "PLANNED", opportunityIds: ["opp-creator-video"], expectedImpact: impact("Modeled operational clarity", 72, 91), timelineDays: 15, tasks: s3i2Tasks, dependencyInitiativeIds: ["init-visual-format"], riskLevel: "HIGH", riskRationale: "Financial and execution authority are unavailable.", confidenceScore: 88, executionReality: "PLANNED" }),
];

type PlanSeed = Omit<
  StrategyDirectorPlan,
  "estimatedCost" | "risk" | "confidence" | "progress" | "provenance"
> & {
  riskLevel: StrategyRiskLevel;
  riskRationale: string;
  confidenceScore: number;
};
function plan(seed: PlanSeed): StrategyDirectorPlan {
  const {
    riskLevel,
    riskRationale,
    confidenceScore,
    initiatives: records,
    ...record
  } = seed;
  const tasks = records.flatMap((item) => item.tasks);
  return {
    ...record,
    initiatives: records,
    progress: Math.round(
      tasks.reduce((total, item) => total + item.progress, 0) / tasks.length,
    ),
    estimatedCost: cost(
      records.reduce(
        (total, item) => total + (item.estimatedCost.amount ?? 0),
        0,
      ),
      "Sum of simulated initiative estimates",
    ),
    risk: risk(riskLevel, riskRationale),
    confidence: confidence(
      confidenceScore,
      "Strategy confidence aggregates simulated cross-domain evidence",
    ),
    provenance,
  };
}

const plans: StrategyDirectorPlan[] = [
  plan({ id: "strat-ai-literacy", title: "Practical AI Literacy", objective: "Build a trusted evidence-led practical AI franchise for technology readers.", situation: "Phase 2 identifies the highest modeled opportunity score in practical AI explainers while Phase 3 confirms only structural distribution and simulated measurement are available.", intelligenceSummary: "Trend acceleration, audience relevance, and a coverage gap align; delivery and outcome authority do not.", opportunities: ["Practical AI explainer series"], strategy: "Sequence evidence synthesis, editorial architecture, verification, structural adaptation, human review, and measurement definition.", expectedOutcomes: ["Six-part reviewed editorial architecture", "Eleven-platform adaptation requirements", "Measurement specification with no causal claim"], status: "REVIEW", initiatives: initiatives.filter((item) => item.strategyId === "strat-ai-literacy"), timelineDays: 30, recommendation: "Prioritize the evidence-led AI series for human review.", nextAction: "Review the editorial-system initiative before any downstream planning.", crossDomain: { opportunityIds: ["opp-ai-explainers"], publishingPlanIds: ["plan-001", "plan-002"], analyticsMetricIds: ["metric-content", "metric-distribution"], experimentIds: ["exp-completed"], storyIds: ["story-001", "story-002"] }, approvalStatus: "pending", executionReality: "SIMULATED", riskLevel: "HIGH", riskRationale: "Modeled opportunity is strong, but publishing and observed outcome data are unavailable.", confidenceScore: 86 }),
  plan({ id: "strat-policy-brief", title: "West African Fintech Policy Brief", objective: "Design a trusted weekly policy briefing for founders and investors.", situation: "Phase 2 models rising policy demand and fragmented coverage; no real source validation, publishing, audience, or experiment runtime is connected.", intelligenceSummary: "The opportunity is qualified but carries high editorial trust and operational risk.", opportunities: ["African fintech policy briefing"], strategy: "Build research and verification first, then prepare a four-week cross-channel pilot specification.", expectedOutcomes: ["Policy question map", "Weekly format and evidence gate", "Cross-channel pilot and experiment specification"], status: "DRAFT", initiatives: initiatives.filter((item) => item.strategyId === "strat-policy-brief"), timelineDays: 30, recommendation: "Approve research design only; keep pilot execution unavailable.", nextAction: "Review policy-source requirements and editorial capacity.", crossDomain: { opportunityIds: ["opp-fintech-policy"], publishingPlanIds: ["plan-004", "plan-006"], analyticsMetricIds: ["metric-growth", "metric-attribution"], experimentIds: ["exp-draft"], storyIds: ["story-004", "story-006"] }, approvalStatus: "draft", executionReality: "PLANNED", riskLevel: "HIGH", riskRationale: "Policy accuracy and unavailable provider execution are material constraints.", confidenceScore: 79 }),
  plan({ id: "strat-founder-visual", title: "Founder Visual Briefings", objective: "Prototype concise evidence-preserving visual briefings for founder audiences.", situation: "Phase 2 models visual-format affinity, while Phase 3 provides structural previews and an inconclusive experiment model only.", intelligenceSummary: "A format hypothesis exists, but audience response, conversion, and economics remain unobserved.", opportunities: ["Founder visual briefing format"], strategy: "Prototype locally, preserve review context, define measurement questions, and block unsupported economics.", expectedOutcomes: ["Three-episode storyboard preview", "Visual quality and compliance review", "Explicit workforce and financial evidence boundaries"], status: "SIMULATED", initiatives: initiatives.filter((item) => item.strategyId === "strat-founder-visual"), timelineDays: 30, recommendation: "Continue the prototype as a simulated review artifact only.", nextAction: "Review whether evidence context survives the visual format.", crossDomain: { opportunityIds: ["opp-creator-video"], publishingPlanIds: ["plan-003", "plan-005"], analyticsMetricIds: ["metric-audience", "metric-unit-economics"], experimentIds: ["exp-paused"], storyIds: ["story-003", "story-005"] }, approvalStatus: "pending", executionReality: "SIMULATED", riskLevel: "HIGH", riskRationale: "No observed audience, conversion, revenue, or cost evidence exists.", confidenceScore: 77 }),
];

function decision(
  id: string,
  strategyId: string,
  initiativeId: string,
  recommendation: string,
  reason: string,
  evidenceIds: (keyof typeof evidenceById)[],
  priority: DecisionPriority,
  domain: DecisionDomain,
  type: DecisionType,
  riskLevel: StrategyRiskLevel,
  costAmount: number,
  status: "PENDING" | "REVIEW" = "PENDING",
  taskId: string | null = null,
): StrategyDirectorDecision {
  return {
    id,
    strategyId,
    initiativeId,
    taskId,
    recommendation,
    reason,
    evidence: evidenceIds.map((item) => evidenceById[item]),
    confidence: confidence(82, "Simulated evidence agreement for decision review"),
    expectedImpact: impact("Modeled decision impact", 60, 84),
    estimatedCost: cost(costAmount, "Simulated decision-scope estimate"),
    risk: risk(riskLevel, `${reason} Human review remains mandatory.`),
    priority,
    domain,
    type,
    status,
    nextAction: "Human reviewer must review, modify, approve, or reject the simulated decision.",
    provenance,
    executionReality: "SIMULATED",
  };
}
const decisions: StrategyDirectorDecision[] = [
  decision("dec-001", "strat-ai-literacy", "init-ai-evidence", "Prioritize the practical AI editorial architecture.", "The highest modeled Growth opportunity aligns with two simulated evidence signals.", ["ev-ai-demand", "ev-ai-gap"], "CRITICAL", "GROWTH", "STRATEGY", "MEDIUM", 3600, "REVIEW", "tsk-ai-02"),
  decision("dec-002", "strat-ai-literacy", "init-ai-distribution", "Keep distribution as structural preview and manual review only.", "Phase 3 reports zero verified provider connections.", ["phase3-distribution"], "HIGH", "DISTRIBUTION", "REVIEW", "HIGH", 2400),
  decision("dec-003", "strat-policy-brief", "init-policy-research", "Approve policy research design before pilot design.", "Policy accuracy risk is high and simulated demand requires authoritative validation.", ["ev-fintech"], "HIGH", "CONTENT", "SEQUENCING", "HIGH", 4200, "REVIEW"),
  decision("dec-004", "strat-policy-brief", "init-policy-pilot", "Require an evidence gate before channel adaptation.", "Publishing-state readiness cannot substitute for policy verification.", ["ev-fintech", "phase3-distribution"], "CRITICAL", "DISTRIBUTION", "REVIEW", "HIGH", 3400),
  decision("dec-005", "strat-founder-visual", "init-visual-format", "Continue the visual prototype as simulation only.", "Visual affinity is modeled and has not been observed.", ["ev-video", "phase3-experiment"], "MEDIUM", "EXPERIMENTATION", "INITIATIVE", "MEDIUM", 2400),
  decision("dec-006", "strat-founder-visual", "init-visual-guardrails", "Block financial optimization claims.", "Phase 3 unit economics remain unavailable.", ["phase3-analytics"], "CRITICAL", "ANALYTICS", "REVIEW", "HIGH", 600, "PENDING", "tsk-visual-04"),
  decision("dec-007", "strat-ai-literacy", "init-ai-evidence", "Keep verification review human-controlled.", "A simulated completion cannot authorize publication.", ["ev-ai-gap"], "HIGH", "CONTENT", "RESOURCE", "MEDIUM", 800),
  decision("dec-008", "strat-founder-visual", "init-visual-guardrails", "Use the canonical workforce projection without task dispatch.", "The repository contains 28 canonical identities but no orchestration runtime.", ["phase3-analytics"], "HIGH", "WORKFORCE", "RESOURCE", "LOW", 1100),
];

const allTasks = initiatives.flatMap((item) => item.tasks);
const workflow = [
  { id: "DISCOVER", title: "Discover", agentIds: ["AGT-001", "AGT-019"], taskIds: ["tsk-ai-01", "tsk-policy-01"], outputs: ["Simulated opportunity signal"], reviewRequired: false },
  { id: "DETECT", title: "Detect", agentIds: ["AGT-001", "AGT-020"], taskIds: ["tsk-visual-01"], outputs: ["Simulated audience and competitor pattern"], reviewRequired: false },
  { id: "VERIFY", title: "Verify", agentIds: ["AGT-008", "AGT-009", "AGT-010", "AGT-011", "AGT-012"], taskIds: ["tsk-ai-03", "tsk-policy-03"], outputs: ["Simulated verification gate"], reviewRequired: true },
  { id: "ANALYZE", title: "Analyze", agentIds: ["AGT-003", "AGT-017", "AGT-019", "AGT-020"], taskIds: ["tsk-ai-06", "tsk-visual-03"], outputs: ["Planned measurement questions"], reviewRequired: true },
  { id: "CREATE", title: "Create", agentIds: ["AGT-002", "AGT-004", "AGT-006", "AGT-007"], taskIds: ["tsk-ai-02", "tsk-policy-02"], outputs: ["Simulated editorial structures"], reviewRequired: true },
  { id: "REVIEW", title: "Review", agentIds: ["AGT-005", "AGT-010", "AGT-028"], taskIds: ["tsk-visual-02"], outputs: ["Simulated review notes"], reviewRequired: true },
  { id: "DISTRIBUTE", title: "Distribute", agentIds: ["AGT-013", "AGT-014", "AGT-015", "AGT-016"], taskIds: ["tsk-ai-04", "tsk-policy-04"], outputs: ["Planned structural adaptations"], reviewRequired: true },
  { id: "MEASURE", title: "Measure", agentIds: ["AGT-017", "AGT-019", "AGT-027"], taskIds: ["tsk-policy-05"], outputs: ["Planned measurement contract"], reviewRequired: true },
  { id: "OPTIMIZE", title: "Optimize", agentIds: ["AGT-018", "AGT-025", "AGT-026"], taskIds: ["tsk-policy-06", "tsk-visual-05"], outputs: ["Simulated sequencing recommendation"], reviewRequired: true },
] as const;

export const strategyDirectorFixture: StrategyDirectorFixture = {
  architectureVersion: "phase-4-strategy-director-v1",
  currentObjective: "Convert the strongest modeled Growth opportunities into reviewable, evidence-backed 30-day strategic plans.",
  currentSituation: "Growth, Distribution, Analytics, and Experimentation experiences are available as deterministic frontend simulations. Strategy execution, orchestration, dispatch, authorization, and override enforcement are unavailable.",
  intelligence: [
    "Practical AI explainers remain the highest modeled opportunity.",
    "Policy briefings carry material verification and capacity risk.",
    "Visual-format affinity is a hypothesis without observed audience evidence.",
    "No provider connection, real publishing, or authoritative financial metric exists.",
  ],
  plans,
  decisions,
  decisionHistory: [
    { id: "dh-001", decisionId: "dec-001", action: "REVIEW", actor: "Demo strategy reviewer", timestamp: "2026-08-19T09:12:00.000Z", previousStatus: "PENDING", resultingStatus: "REVIEW", note: "Opened the recommendation for simulated review.", executionReality: "SIMULATED", provenance },
    { id: "dh-002", decisionId: "dec-002", action: "MODIFY", actor: "Demo strategy reviewer", timestamp: "2026-08-19T09:18:00.000Z", previousStatus: "REVIEW", resultingStatus: "MODIFIED", note: "Added an explicit no-provider-execution condition.", executionReality: "SIMULATED", provenance },
    { id: "dh-003", decisionId: "dec-003", action: "APPROVE", actor: "Demo strategy reviewer", timestamp: "2026-08-19T09:25:00.000Z", previousStatus: "REVIEW", resultingStatus: "APPROVED", note: "Approved the simulated research design only.", executionReality: "SIMULATED", provenance },
    { id: "dh-004", decisionId: "dec-005", action: "REJECT", actor: "Demo strategy reviewer", timestamp: "2026-08-19T09:34:00.000Z", previousStatus: "REVIEW", resultingStatus: "REJECTED", note: "Rejected any interpretation of the prototype as an observed result.", executionReality: "SIMULATED", provenance },
    { id: "dh-005", decisionId: "dec-008", action: "MODIFY", actor: "Demo strategy reviewer", timestamp: "2026-08-19T09:41:00.000Z", previousStatus: "PENDING", resultingStatus: "MODIFIED", note: "Clarified that assignment is a presentation projection, not dispatch.", executionReality: "SIMULATED", provenance },
  ],
  workflow: workflow.map((item, index) => ({
    ...item,
    agentIds: [...item.agentIds],
    taskIds: [...item.taskIds],
    outputs: [...item.outputs],
    order: index + 1,
    progress: Math.round(
      item.taskIds.reduce(
        (total, taskId) =>
          total + (allTasks.find((record) => record.id === taskId)?.progress ?? 0),
        0,
      ) / item.taskIds.length,
    ),
    dependencyStageIds: index ? [workflow[index - 1]?.id ?? "DISCOVER"] : [],
    provenance,
    executionReality: "SIMULATED",
  })),
  timeline: allTasks.map((item, index) => ({
    id: `timeline-${String(index + 1).padStart(2, "0")}`,
    strategyId: item.strategyId,
    initiativeId: item.initiativeId,
    taskId: item.id,
    agentId: item.agentIds[0] ?? "AGT-001",
    title: item.title,
    day: item.startDay,
    durationDays: item.durationDays,
    milestone: index % 3 === 2,
    status: item.status,
    provenance,
    executionReality:
      item.executionReality === "SIMULATED" ? "SIMULATED" : "PLANNED",
  })),
  overrideHistory: [
    { id: "ov-001", action: "PAUSE", targetType: "TASK", targetId: "tsk-ai-02", timestamp: "2026-08-19T10:00:00.000Z", actor: "Demo strategy reviewer", previousState: "WORKING", resultingState: "PAUSE_REQUESTED", reason: "Demonstrate human review before verification.", executionReality: "SIMULATED", provenance },
    { id: "ov-002", action: "OVERRIDE", targetType: "INITIATIVE", targetId: "init-policy-pilot", timestamp: "2026-08-19T10:08:00.000Z", actor: "Demo strategy reviewer", previousState: "PLANNED", resultingState: "OVERRIDE_APPLIED", reason: "Simulate an evidence-gate requirement.", executionReality: "SIMULATED", provenance },
    { id: "ov-003", action: "STOP", targetType: "TASK", targetId: "tsk-visual-04", timestamp: "2026-08-19T10:16:00.000Z", actor: "Demo strategy reviewer", previousState: "BLOCKED", resultingState: "STOP_REQUESTED", reason: "Financial evidence is unavailable.", executionReality: "SIMULATED", provenance: unavailable },
    { id: "ov-004", action: "PAUSE", targetType: "AGENT", targetId: "AGT-014", timestamp: "2026-08-19T10:24:00.000Z", actor: "Demo strategy reviewer", previousState: "IDLE", resultingState: "PAUSE_APPLIED", reason: "Demonstrate that the visible state does not affect a runtime.", executionReality: "SIMULATED", provenance },
  ],
  provenance,
};
