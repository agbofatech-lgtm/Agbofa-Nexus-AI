import { createDataProvenance, demoDataState, type DataState } from "@/types/data-state";
import type { GrowthIntelligenceData } from "@/types/growth-intelligence";
import type { Phase2FoundationSnapshot } from "@/types/phase2";
import type { Phase3ExperienceData } from "@/types/phase3-experience";
import type { Phase5ExperienceData } from "@/types/phase5-experience";
import type { StrategyDirectorData } from "@/types/strategy-director";
import type {
  CrossPhaseIntegrityRecord,
  ExecutiveActivityEvent,
  ExecutiveCapabilityHealth,
  ExecutiveCommandData,
  ExecutiveGovernance,
  ExecutiveLoopNode,
  ExecutiveMetric,
  ExecutivePhaseStatus,
  ExecutiveSearchRecord,
  ExecutiveSignal,
} from "@/types/executive-command";

interface ExecutiveSources {
  foundation: Phase2FoundationSnapshot;
  growth: GrowthIntelligenceData;
  phase3: Phase3ExperienceData;
  strategy: StrategyDirectorData;
  phase5: Phase5ExperienceData;
  stories: readonly { id: string; headline: string; summary: string }[];
}

const aggregateProvenance = createDataProvenance(
  "mock",
  "Phase 6 executive projection",
  "Top-N summaries derived from certified Phase 1–5 frontend services. No live operations or execution authority.",
);
const unavailableProvenance = createDataProvenance(
  "unavailable",
  "Authoritative integration unavailable",
  "No production telemetry, provider, revenue, billing, execution, or backend health source is connected.",
);
const confidence = (score: number, basis: string) => ({
  score,
  basis,
  kind: "model" as const,
});

function signal(
  id: string,
  label: string,
  summary: string,
  sourceId: string,
  provenance: ExecutiveSignal["provenance"],
  executionReality: ExecutiveSignal["executionReality"],
  score?: number,
): ExecutiveSignal {
  return {
    id,
    label,
    summary,
    sourceId,
    confidence:
      typeof score === "number"
        ? confidence(score, "Inherited from canonical source projection")
        : null,
    provenance,
    executionReality,
  };
}

export function adaptExecutiveCommand(
  sources: ExecutiveSources,
): DataState<ExecutiveCommandData> {
  const enabledExecution = Object.values(sources.foundation.execution).filter(Boolean);
  if (enabledExecution.length)
    throw new Error("Executive projection detected an enabled execution flag.");

  const opportunities = [...sources.growth.opportunities]
    .sort((first, second) => second.score - first.score)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      priority: item.score,
      confidence: item.confidence,
      expectedImpact:
        item.expectedImpact.value === null
          ? "Unavailable"
          : `${item.expectedImpact.value}% modeled`,
      evidenceCount: item.evidenceIds.length,
      href: `/growth/opportunities#${item.id}`,
      provenance: item.provenance,
      executionReality: "SIMULATED" as const,
      classification: "FIXTURE" as const,
    }));
  const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
  const decisions = [...sources.strategy.decisions]
    .sort(
      (first, second) =>
        priorityOrder[second.priority] - priorityOrder[first.priority],
    )
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      recommendation: item.recommendation,
      priority: item.priority,
      confidence: item.confidence,
      risk: item.risk.level,
      expectedImpact: item.expectedImpact.label,
      approvalState: item.status,
      href: "/growth/decisions",
      provenance: item.provenance,
      executionReality: "SIMULATED" as const,
      classification: "RECOMMENDATION" as const,
    }));
  const strategies = sources.strategy.plans.map((item) => ({
    id: item.id,
    title: item.title,
    progress: item.progress,
    risk: item.risk.level,
    confidence: item.confidence,
    priorityInitiative: item.initiatives[0]?.title ?? "Unavailable",
    nextAction: item.nextAction,
    pendingDecisions: sources.strategy.decisions.filter(
      (decision) =>
        decision.strategyId === item.id &&
        ["PENDING", "REVIEW", "MODIFIED"].includes(decision.status),
    ).length,
    href: "/growth/strategy",
    provenance: item.provenance,
    executionReality: item.executionReality,
    classification: "RECOMMENDATION" as const,
  }));
  const registeredAgents = sources.strategy.workforce.length;
  const workforce = {
    total: registeredAgents,
    registeredSource: "FIXTURE" as const,
    liveTelemetry: "UNAVAILABLE" as const,
    working: sources.strategy.workforce.filter((item) => item.status === "WORKING")
      .length,
    blocked: sources.strategy.workforce.filter((item) => item.status === "BLOCKED")
      .length,
    waitingApproval: sources.strategy.workforce.filter(
      (item) => item.status === "WAITING_APPROVAL",
    ).length,
    completed: sources.strategy.workforce.filter(
      (item) => item.status === "COMPLETED",
    ).length,
    failed: sources.strategy.workforce.filter((item) => item.status === "FAILED")
      .length,
    provenance: sources.strategy.provenance,
    executionReality: "SIMULATED" as const,
    classification: "FIXTURE" as const,
  };
  const completedExperiment = sources.phase3.experimentation.experiments.find(
    (item) => item.state === "COMPLETED",
  );
  const experiments = {
    active: sources.phase3.experimentation.experiments.filter(
      (item) => item.state === "ACTIVE",
    ).length,
    completed: sources.phase3.experimentation.experiments.filter(
      (item) => item.state === "COMPLETED",
    ).length,
    resultState: completedExperiment?.result?.statisticallySignificant
      ? "SIMULATED_SIGNIFICANT"
      : "SIMULATED_INCONCLUSIVE",
    confidence: confidence(
      completedExperiment?.result ? 72 : 0,
      "Phase 3 statistical fixture state, not observed evidence",
    ),
    learning:
      completedExperiment?.learning ?? "No completed experiment learning available.",
    href: "/experiments",
    provenance: sources.phase3.experimentation.provenance,
    executionReality: "SIMULATED" as const,
    classification: "FIXTURE" as const,
  };
  const estimatedTaskCost = Number(
    sources.phase5.taskCosts
      .reduce((total, item) => total + item.estimatedCost, 0)
      .toFixed(4),
  );
  const economics = {
    estimatedTaskCost,
    estimatedBudget:
      sources.phase5.budgetPlans.find((item) => item.id === "budget-balanced")
        ?.budget ?? 0,
    strategyComparison: `${sources.phase5.costAwareStrategies.length} estimated strategy/mode options`,
    actualCost: "UNAVAILABLE" as const,
    actualRevenue: "UNAVAILABLE" as const,
    verifiedRoi: "UNAVAILABLE" as const,
    provenance: sources.phase5.taskCosts[0]?.provenance ?? unavailableProvenance,
    executionReality: "ESTIMATED" as const,
    classification: "ESTIMATED" as const,
    costKind: "ESTIMATED" as const,
  };
  const latestLearning =
    sources.phase5.memories.find((item) => item.trustState === "NEEDS_REVIEW") ??
    sources.phase5.memories[0];
  if (!latestLearning) throw new Error("Executive learning summary requires memory data.");
  const learning = {
    id: latestLearning.id,
    insight: latestLearning.insight,
    evidenceCount: latestLearning.evidence.length,
    confidence: latestLearning.confidence,
    sampleSize: latestLearning.sampleSize,
    source: latestLearning.source,
    applicability: latestLearning.applicability,
    memoryState: latestLearning.trustState,
    href: `/growth/memory#${latestLearning.id}`,
    provenance: latestLearning.provenance,
    executionReality: "SIMULATED" as const,
    classification: "FIXTURE" as const,
    privilege: "DATA_ONLY" as const,
  };

  const growthMetrics = new Map(
    sources.growth.metrics.map((item) => [item.id, item]),
  );
  const metric = (
    id: "audience" | "reach" | "engagement" | "conversion",
  ): ExecutiveMetric => {
    const source = growthMetrics.get(id);
    if (!source) throw new Error(`Missing Growth metric: ${id}`);
    return {
      id,
      label: source.label,
      displayValue: source.displayValue,
      context: `${source.period} · ${source.change >= 0 ? "+" : ""}${source.change}% modeled change`,
      authority: source.provenance.kind,
      confidence: source.confidence,
      sourceId: source.id,
      provenance: source.provenance,
      executionReality: "SIMULATED",
      classification: "FIXTURE",
    };
  };
  const metrics: ExecutiveMetric[] = [
    metric("audience"),
    metric("reach"),
    metric("engagement"),
    metric("conversion"),
    {
      id: "revenue",
      label: "Authoritative revenue",
      displayValue: "UNAVAILABLE",
      context: "No billing or recognized revenue source",
      authority: "unavailable",
      confidence: null,
      sourceId: "financial-truth",
      provenance: sources.phase5.financialTruth.actualRevenue.provenance,
      executionReality: "UNAVAILABLE",
      classification: "UNAVAILABLE",
    },
    {
      id: "distribution",
      label: "Verified provider connections",
      displayValue: String(
        sources.phase3.distribution.accounts.filter(
          (item) => item.state === "CONNECTED",
        ).length,
      ),
      context: "Repository-observed connection boundary",
      authority: "manual",
      confidence: confidence(100, "Phase 3 account-state contract"),
      sourceId: "metric-distribution",
      provenance:
        sources.phase3.analytics.metrics.find(
          (item) => item.id === "metric-distribution",
        )?.provenance ?? unavailableProvenance,
      executionReality: "UNAVAILABLE",
      classification: "PENDING",
    },
    {
      id: "experiments",
      label: "Experiment fixtures",
      displayValue: `${experiments.active} active · ${experiments.completed} complete`,
      context: experiments.resultState.replaceAll("_", " "),
      authority: "mock",
      confidence: experiments.confidence,
      sourceId: "phase3-experiments",
      provenance: experiments.provenance,
      executionReality: "SIMULATED",
      classification: "FIXTURE",
    },
    {
      id: "strategy-progress",
      label: "Average strategic progress",
      displayValue: `${Math.round(strategies.reduce((sum, item) => sum + item.progress, 0) / strategies.length)}%`,
      context: "Across simulated 30-day plans",
      authority: "mock",
      confidence: confidence(81, "Average of deterministic plan progress"),
      sourceId: "phase4-strategies",
      provenance: sources.strategy.provenance,
      executionReality: "SIMULATED",
      classification: "FIXTURE",
    },
    {
      id: "ai-cost",
      label: "Estimated selected-task cost",
      displayValue: `$${estimatedTaskCost.toFixed(2)}`,
      context: "Illustrative catalog rates; not billing",
      authority: "estimated",
      confidence: confidence(72, "Phase 5 estimated token-cost arithmetic"),
      sourceId: "phase5-task-costs",
      provenance: economics.provenance,
      executionReality: "ESTIMATED",
      classification: "ESTIMATED",
    },
  ];

  const topOpportunity = opportunities[0];
  const topStrategy = strategies[0];
  const highestRisk = [...sources.strategy.plans].sort(
    (first, second) =>
      ({ HIGH: 3, MEDIUM: 2, LOW: 1 })[second.risk.level] -
      ({ HIGH: 3, MEDIUM: 2, LOW: 1 })[first.risk.level],
  )[0];
  if (!topOpportunity || !topStrategy || !highestRisk)
    throw new Error("Executive situation requires opportunity and strategy data.");
  const situation = {
    operatingState: signal(
      "situation-operating",
      "Current operating state",
      "All certified frontend experiences are available as experience or simulation; every execution-sensitive flag remains off.",
      "phase1-foundation",
      sources.foundation.provenance,
      "SIMULATED",
      100,
    ),
    majorChange: signal(
      "situation-change",
      "Major change",
      `${sources.phase5.memoryConflicts.length} explicit memory conflict requires human review instead of silent consolidation.`,
      sources.phase5.memoryConflicts[0]?.id ?? "phase5-memory",
      sources.phase5.provenance,
      "SIMULATED",
      100,
    ),
    topOpportunity: signal(
      "situation-opportunity",
      "Most important opportunity",
      `${topOpportunity.title} leads the modeled opportunity set at ${topOpportunity.priority}/100.`,
      topOpportunity.id,
      topOpportunity.provenance,
      "SIMULATED",
      topOpportunity.confidence.score,
    ),
    highestRisk: signal(
      "situation-risk",
      "Highest priority risk",
      highestRisk.risk.rationale,
      highestRisk.id,
      highestRisk.provenance,
      highestRisk.executionReality,
      highestRisk.confidence.score,
    ),
    decisionPressure: signal(
      "situation-decisions",
      "Decisions awaiting owner",
      `${sources.strategy.decisions.filter((item) => ["PENDING", "REVIEW", "MODIFIED"].includes(item.status)).length} simulated decisions await human review.`,
      "phase4-decisions",
      sources.strategy.provenance,
      "SIMULATED",
      100,
    ),
    strategyDirection: signal(
      "situation-strategy",
      "Current strategy direction",
      topStrategy.nextAction,
      topStrategy.id,
      topStrategy.provenance,
      topStrategy.executionReality,
      topStrategy.confidence.score,
    ),
    learningSignal: signal(
      "situation-learning",
      "Current learning signal",
      learning.insight,
      learning.id,
      learning.provenance,
      "SIMULATED",
      learning.confidence.score,
    ),
  };

  const activity: ExecutiveActivityEvent[] = [
    {
      id: sources.strategy.decisionHistory[0]?.id ?? "activity-decision",
      timestamp:
        sources.strategy.decisionHistory[0]?.timestamp ?? "2026-08-19T09:12:00.000Z",
      domain: "Decision",
      title: "Strategy recommendation entered review",
      description:
        sources.strategy.decisionHistory[0]?.note ?? "Simulated decision review.",
      severity: "WARNING",
      status: "REVIEW",
      sourceId: sources.strategy.decisionHistory[0]?.decisionId ?? "dec-001",
      provenance: sources.strategy.provenance,
      executionReality: "SIMULATED",
      classification: "FIXTURE",
    },
    ...sources.phase5.autonomyAudit
      .slice(0, 5)
      .map<ExecutiveActivityEvent>((item) => ({
      id: item.id,
      timestamp: item.timestamp,
      domain: item.action.includes("MEMORY") ? "Memory" : "Autonomy",
      title: item.action.replaceAll("_", " "),
      description: item.reason,
      severity: item.action.includes("PAUSE") ? ("WARNING" as const) : ("INFO" as const),
      status: item.resultingState,
      sourceId: item.target,
      provenance: item.provenance,
      executionReality: "SIMULATED" as const,
      classification: "FIXTURE" as const,
    })),
    {
      id: `activity-${completedExperiment?.id ?? "experiment"}`,
      timestamp:
        sources.phase5.memories
          .find((item) =>
            item.evidence.some(
              (evidence) => evidence.sourceId === completedExperiment?.id,
            ),
          )
          ?.evidence.find(
            (evidence) => evidence.sourceId === completedExperiment?.id,
          )?.observedAt ?? "2026-08-19T09:20:00.000Z",
      domain: "Experiment",
      title: "Experiment result qualified",
      description:
        completedExperiment?.learning ??
        "No completed experiment learning available.",
      severity: "INFO",
      status: "SIMULATED INCONCLUSIVE",
      sourceId: completedExperiment?.id ?? "phase3-experiment",
      provenance: sources.phase3.experimentation.provenance,
      executionReality: "SIMULATED",
      classification: "FIXTURE",
    },
    {
      id: sources.phase5.memoryConflicts[0]?.id ?? "activity-conflict",
      timestamp: sources.phase5.memories.find((item) => item.conflictIds.length)?.updatedAt ?? "2026-08-19T12:00:00.000Z",
      domain: "Memory",
      title: "Conflicting learning requires review",
      description:
        sources.phase5.memoryConflicts[0]?.reason ?? "Memory conflict unavailable.",
      severity: "CRITICAL",
      status: "NEEDS REVIEW",
      sourceId: sources.phase5.memoryConflicts[0]?.id ?? "memory-conflict",
      provenance: sources.phase5.provenance,
      executionReality: "SIMULATED",
      classification: "FIXTURE",
    },
    {
      id: sources.growth.evidence[0]?.id ?? "activity-growth",
      timestamp:
        sources.growth.evidence[0]?.timestamp ?? "2026-08-19T08:00:00.000Z",
      domain: "Growth",
      title: "Opportunity evidence projected",
      description:
        sources.growth.evidence[0]?.observation ?? "Growth evidence unavailable.",
      severity: "INFO",
      status: "SIMULATED SIGNAL",
      sourceId: topOpportunity.id,
      provenance: topOpportunity.provenance,
      executionReality: "SIMULATED",
      classification: "FIXTURE",
    },
  ];
  activity.sort((first, second) =>
    second.timestamp.localeCompare(first.timestamp),
  );

  const loopSpecs: Array<{
    id: ExecutiveLoopNode["id"];
    description: string;
    href: string;
    capabilityState: ExecutiveLoopNode["capabilityState"];
    reality: ExecutiveLoopNode["executionReality"];
    provenance: ExecutiveLoopNode["provenance"];
  }> = [
    { id: "OBSERVE", description: "Stories and deterministic signals enter the frontend model.", href: "/reader", capabilityState: "AVAILABLE", reality: "PLANNED", provenance: aggregateProvenance },
    { id: "UNDERSTAND", description: "Evidence, audience, and analytics projections provide context.", href: "/analytics", capabilityState: "SIMULATED", reality: "SIMULATED", provenance: sources.phase3.provenance },
    { id: "DISCOVER", description: "Growth Intelligence ranks modeled opportunities.", href: "/growth/opportunities", capabilityState: "SIMULATED", reality: "SIMULATED", provenance: sources.growth.provenance },
    { id: "RECOMMEND", description: "Strategy Director prepares evidence-backed recommendations.", href: "/growth/strategy", capabilityState: "SIMULATED", reality: "SIMULATED", provenance: sources.strategy.provenance },
    { id: "DECIDE", description: "A human reviews simulated decisions.", href: "/growth/decisions", capabilityState: "AVAILABLE", reality: "SIMULATED", provenance: sources.strategy.provenance },
    { id: "EXECUTE", description: "Phase 04 publishing exists; real provider publication remains blocked. Command Center cannot bypass CONTENT → BRAND → POLICY → APPROVAL → PHASE 04 → PROVIDER.", href: "/distribution", capabilityState: "PENDING", reality: "PENDING", provenance: unavailableProvenance },
    { id: "MEASURE", description: "Phase 3 exposes deterministic measurement and truth states.", href: "/analytics", capabilityState: "SIMULATED", reality: "SIMULATED", provenance: sources.phase3.provenance },
    { id: "LEARN", description: "Experiment and analytics fixtures produce qualified learnings.", href: "/experiments", capabilityState: "SIMULATED", reality: "SIMULATED", provenance: sources.phase3.provenance },
    { id: "REMEMBER", description: "Memory is data. It cannot grant RBAC, approve publishing, or disable safety.", href: "/growth/memory", capabilityState: "SIMULATED", reality: "SIMULATED", provenance: sources.phase5.provenance },
    { id: "NEXT_STRATEGY", description: "Learning returns to human-reviewed strategic planning.", href: "/growth/strategy", capabilityState: "SIMULATED", reality: "PLANNED", provenance: sources.strategy.provenance },
  ];
  const loop = loopSpecs.map((item, index) => ({
    id: item.id,
    order: index + 1,
    description: item.description,
    href: item.href,
    capabilityState: item.capabilityState,
    provenance: item.provenance,
    executionReality: item.reality,
  }));

  const capabilities: ExecutiveCapabilityHealth[] = [
    { id: "health-frontend", domain: "Frontend OS", capability: "AVAILABLE", detail: "Cinematic frontend shell is present. Rendering is not production uptime telemetry.", telemetryReality: "PENDING", sourceId: "phase1-foundation", href: "/settings", provenance: sources.foundation.provenance, executionReality: "PLANNED" },
    { id: "health-agents", domain: "Agent Workforce", capability: "SIMULATED", detail: `${registeredAgents} registered fixture agents. Live workforce telemetry is UNAVAILABLE. Count is not live reality.`, telemetryReality: "UNAVAILABLE", sourceId: "canonical-agent-registry", href: "/agents", provenance: sources.strategy.provenance, executionReality: "SIMULATED" },
    { id: "health-distribution", domain: "Distribution", capability: "PENDING", detail: "Phase 03 is PARTIALLY CERTIFIED. YouTube OAuth is not collapsed into full distribution certification.", telemetryReality: "PENDING", sourceId: "metric-distribution", href: "/distribution", provenance: sources.phase3.provenance, executionReality: "PENDING" },
    { id: "health-youtube", domain: "YouTube", capability: "NOT_CONNECTED", detail: "Do not treat OAuth connection as complete provider publication. Connection state hydrates from BFF when authenticated.", telemetryReality: "PENDING", sourceId: "youtube-boundary", href: "/social/connect", provenance: unavailableProvenance, executionReality: "NOT_CONNECTED" },
    { id: "health-publishing", domain: "Publishing", capability: "PENDING", detail: "Phase 04 schedule/cancel exist. Real provider publication remains blocked. Kill-switch ENGAGED blocks schedule.", telemetryReality: "PENDING", sourceId: "phase4-publishing", href: "/distribution", provenance: sources.phase3.provenance, executionReality: "PENDING" },
    { id: "health-analytics", domain: "Analytics", capability: "SIMULATED", detail: "Truth-aware deterministic analytics; no live analytics backend.", telemetryReality: "SIMULATED", sourceId: "metric-overview", href: "/analytics", provenance: sources.phase3.provenance, executionReality: "SIMULATED" },
    { id: "health-strategy", domain: "Strategy", capability: "SIMULATED", detail: "Recommendations, plans, decisions, and timelines; no execution engine.", telemetryReality: "SIMULATED", sourceId: "phase4-strategy", href: "/growth/strategy", provenance: sources.strategy.provenance, executionReality: "SIMULATED" },
    { id: "health-autonomy", domain: "Autonomy", capability: "PENDING", detail: "Phase 05 control is implemented. Dashboard display does not grant autonomy. Live kill-switch hydrates from BFF when authenticated.", telemetryReality: "PENDING", sourceId: "phase5-autonomy", href: "/ai-control/autonomy", provenance: sources.phase5.provenance, executionReality: "PENDING" },
    { id: "health-memory", domain: "Memory", capability: "PENDING", detail: "Memory is data only. Live list hydrates from BFF; fixture learning remains labeled FIXTURE.", telemetryReality: "PENDING", sourceId: "phase5-memory", href: "/growth/memory", provenance: sources.phase5.provenance, executionReality: "PENDING" },
    { id: "health-scenarios", domain: "Scenarios", capability: "SIMULATED", detail: "Scenarios are PROJECTED, not historical actuals.", telemetryReality: "PROJECTED", sourceId: "phase5-scenarios", href: "/growth/scenarios", provenance: sources.phase5.provenance, executionReality: "PROJECTED" },
    { id: "health-economics", domain: "AI Cost", capability: "SIMULATED", detail: "Estimated micros from the model registry. Not invoices or provider billing.", telemetryReality: "ESTIMATED", sourceId: "phase5-economics", href: "/ai-cost", provenance: economics.provenance, executionReality: "ESTIMATED" },
    { id: "health-providers", domain: "External Providers", capability: "NOT_CONNECTED", detail: "Provider credentials never enter the browser. Connection is not distribution certification.", telemetryReality: "UNAVAILABLE", sourceId: "provider-boundary", href: "/ai-control", provenance: unavailableProvenance, executionReality: "NOT_CONNECTED" },
  ];

  const withSearch = (
    item: Omit<ExecutiveSearchRecord, "mutates" | "sourceId" | "provenance" | "executionReality"> &
      Partial<Pick<ExecutiveSearchRecord, "sourceId" | "provenance" | "executionReality">>,
  ): ExecutiveSearchRecord => ({
    ...item,
    sourceId: item.sourceId ?? item.id,
    provenance: item.provenance ?? aggregateProvenance,
    executionReality: item.executionReality ?? "PLANNED",
    mutates: false,
  });
  const staticSearch: ExecutiveSearchRecord[] = [
    withSearch({ id: "search-reader", label: "Reader", description: "Evidence-aware story feed", href: "/reader", domain: "Story", keywords: ["news", "stories"] }),
    withSearch({ id: "search-growth", label: "Executive Command Center", description: "Cross-system executive operating surface", href: "/growth", domain: "Intelligence", keywords: ["executive", "command", "growth"] }),
    withSearch({ id: "search-distribution", label: "Distribution", description: "Adaptation, accounts, queues, and health", href: "/distribution", domain: "Distribution", keywords: ["channels"] }),
    withSearch({ id: "search-publishing", label: "Publishing", description: "Navigate to the publishing workflow. Does not publish.", href: "/distribution", domain: "Publishing", keywords: ["publish", "schedule", "brand"] }),
    withSearch({ id: "search-analytics", label: "Analytics", description: "Truth-aware measurement and attribution", href: "/analytics", domain: "Analytics", keywords: ["performance", "metrics"] }),
    withSearch({ id: "search-experiments", label: "Experiment Lab", description: "Simulated experiment register", href: "/experiments", domain: "Experiment", keywords: ["hypothesis", "variants"] }),
    withSearch({ id: "search-memory", label: "Memory", description: "Governed learning records. Memory is data, not permission.", href: "/growth/memory", domain: "Memory", keywords: ["learning", "insight"] }),
    withSearch({ id: "search-scenarios", label: "Scenarios", description: "PROJECTED what-if records, not historical actuals", href: "/growth/scenarios", domain: "Scenario", keywords: ["projected", "what-if"] }),
    withSearch({ id: "search-ai-cost", label: "AI Economics", description: "Estimated model, token, and strategy costs", href: "/ai-cost", domain: "AI Cost", keywords: ["budget", "tokens", "cost"] }),
    withSearch({ id: "search-ai-control", label: "AI Control", description: "Autonomy control and kill-switch. Display does not grant autonomy.", href: "/ai-control/autonomy", domain: "AI Control", keywords: ["models", "providers", "autonomy", "kill switch"] }),
    withSearch({ id: "search-settings", label: "Settings", description: "Canonical frontend control plane", href: "/settings", domain: "Settings", keywords: ["preferences", "capabilities"] }),
    withSearch({ id: "search-cmd-publish", label: "Publish", description: "Navigate to publishing. Does not publish, spend, or call a provider.", href: "/distribution", domain: "Publishing", keywords: ["publish", "post"] }),
    withSearch({ id: "search-cmd-approve", label: "Approve", description: "Navigate to the decision/approval workflow. Does not approve.", href: "/growth/decisions", domain: "Decision", keywords: ["approve", "review"] }),
    withSearch({ id: "search-cmd-run", label: "Run strategy", description: "Navigate to run simulation. Does not execute a strategy.", href: "/growth/runs", domain: "Strategy", keywords: ["run", "execute", "dispatch"] }),
  ];
  const searchIndex: ExecutiveSearchRecord[] = [
    ...staticSearch,
    ...sources.stories.map((item) => withSearch({ id: `search-${item.id}`, label: item.headline, description: item.summary, href: `/reader/${item.id}`, domain: "Story", keywords: [item.id, "article"], sourceId: item.id, executionReality: "PLANNED" })),
    ...sources.growth.opportunities.map((item) => withSearch({ id: `search-${item.id}`, label: item.title, description: item.summary, href: `/growth/opportunities#${item.id}`, domain: "Opportunity", keywords: [item.id, item.source, item.urgency], sourceId: item.id, provenance: item.provenance, executionReality: "SIMULATED" })),
    ...sources.strategy.workforce.map((item) => withSearch({ id: `search-${item.agent.id}`, label: `${item.agent.id} · ${item.agent.name}`, description: item.agent.description, href: `/agents/${item.agent.id}`, domain: "Agent", keywords: [item.agent.category, item.status], sourceId: item.agent.id, provenance: item.provenance, executionReality: "SIMULATED" })),
    ...sources.strategy.plans.map((item) => withSearch({ id: `search-${item.id}`, label: item.title, description: item.objective, href: "/growth/strategy", domain: "Strategy", keywords: [item.id, item.status], sourceId: item.id, provenance: item.provenance, executionReality: item.executionReality })),
    ...sources.strategy.decisions.map((item) => withSearch({ id: `search-${item.id}`, label: item.recommendation, description: item.reason, href: "/growth/decisions", domain: "Decision", keywords: [item.id, item.domain, item.priority], sourceId: item.id, provenance: item.provenance, executionReality: "SIMULATED" })),
    ...sources.phase3.experimentation.experiments.map((item) => withSearch({ id: `search-${item.id}`, label: item.name, description: item.hypothesis, href: "/experiments", domain: "Experiment", keywords: [item.id, item.state], sourceId: item.id, provenance: item.provenance, executionReality: "SIMULATED" })),
    ...sources.phase5.memories.map((item) => withSearch({ id: `search-${item.id}`, label: item.insight, description: `${item.category} · ${item.trustState}`, href: `/growth/memory#${item.id}`, domain: "Memory", keywords: [item.id, item.category, item.trustState], sourceId: item.id, provenance: item.provenance, executionReality: "SIMULATED" })),
    ...sources.phase5.scenarios.map((item) => withSearch({ id: `search-${item.id}`, label: item.name, description: item.expectedImpact, href: `/growth/scenarios#${item.id}`, domain: "Scenario", keywords: [item.id, item.mode], sourceId: item.id, provenance: item.provenance, executionReality: "PROJECTED" })),
  ];
  const duplicateSearchIds = new Set<string>();
  for (const item of searchIndex) {
    if (duplicateSearchIds.has(item.id)) throw new Error(`Duplicate search ID: ${item.id}`);
    duplicateSearchIds.add(item.id);
  }

  const integrity: CrossPhaseIntegrityRecord[] = [];
  for (const strategy of sources.strategy.plans) {
    for (const opportunityId of strategy.crossDomain.opportunityIds) {
      integrity.push({
        id: `integrity-${opportunityId}-${strategy.id}`,
        relationship: "Opportunity → Strategy",
        sourceId: opportunityId,
        targetId: strategy.id,
        status: sources.growth.opportunities.some(
          (item) => item.id === opportunityId,
        )
          ? "VALID"
          : "BROKEN",
        detail: "Phase 4 strategy cross-domain link",
      });
    }
    for (const initiative of strategy.initiatives) {
      for (const task of initiative.tasks) {
        for (const agentId of task.agentIds) {
          integrity.push({
            id: `integrity-${task.id}-${agentId}`,
            relationship: "Task → Agent",
            sourceId: task.id,
            targetId: agentId,
            status: sources.strategy.workforce.some(
              (item) => item.agent.id === agentId,
            )
              ? "VALID"
              : "BROKEN",
            detail: "Canonical workforce assignment projection",
          });
        }
      }
    }
  }
  for (const memory of sources.phase5.memories) {
    for (const evidence of memory.evidence) {
      integrity.push({
        id: `integrity-${memory.id}-${evidence.id}`,
        relationship: "Learning → Memory",
        sourceId: evidence.sourceId,
        targetId: memory.id,
        status: "VALID",
        detail:
          "Phase 5 memory evidence link validated by its canonical adapter",
      });
    }
  }
  for (const option of sources.phase5.costAwareStrategies) {
    integrity.push({
      id: `integrity-${option.id}`,
      relationship: "Strategy → Cost",
      sourceId: option.strategyId,
      targetId: option.id,
      status: sources.strategy.plans.some(
        (item) => item.id === option.strategyId,
      )
        ? "VALID"
        : "BROKEN",
      detail: "Phase 5 estimated strategy economics link",
    });
  }
  const firstStrategy = sources.strategy.plans[0];
  const firstInitiative = firstStrategy?.initiatives[0];
  const firstTask = firstInitiative?.tasks[0];
  const firstAgentId = firstTask?.agentIds[0];
  const distributionPlan = sources.phase3.distribution.publishingPlans[0];
  const attributionJourney = sources.phase3.analytics.attribution[0];
  const nextStrategyMemory = sources.phase5.memories.find(
    (memory) => memory.applicability.includes("strat-ai-literacy"),
  );
  const autonomyPolicy = sources.phase5.autonomyDomains.find(
    (policy) => policy.id === "STRATEGY",
  );
  const scenario = sources.phase5.scenarios.find(
    (item) => item.id === "scenario-balanced",
  );
  const costOption = sources.phase5.costAwareStrategies.find(
    (item) =>
      item.strategyId === "strat-ai-literacy" && item.mode === "BALANCED",
  );
  const humanDecision = sources.strategy.decisions.find(
    (item) => item.strategyId === "strat-ai-literacy",
  );
  const chainChecks: CrossPhaseIntegrityRecord[] = [
    {
      id: "integrity-strategy-initiative",
      relationship: "Strategy → Initiative",
      sourceId: firstStrategy?.id ?? "missing-strategy",
      targetId: firstInitiative?.id ?? "missing-initiative",
      status: firstStrategy && firstInitiative ? "VALID" : "BROKEN",
      detail: "Phase 4 plan hierarchy",
    },
    {
      id: "integrity-initiative-task",
      relationship: "Initiative → Task",
      sourceId: firstInitiative?.id ?? "missing-initiative",
      targetId: firstTask?.id ?? "missing-task",
      status: firstInitiative && firstTask ? "VALID" : "BROKEN",
      detail: "Phase 4 initiative hierarchy",
    },
    {
      id: "integrity-agent-distribution",
      relationship: "Agent → Distribution",
      sourceId: firstAgentId ?? "missing-agent",
      targetId: distributionPlan?.id ?? "missing-distribution-plan",
      status:
        firstAgentId &&
        sources.strategy.workforce.some(
          (item) => item.agent.id === firstAgentId,
        ) &&
        distributionPlan
          ? "VALID"
          : "BROKEN",
      detail: "Canonical agent projection to Phase 3 distribution plan",
    },
    {
      id: "integrity-distribution-analytics",
      relationship: "Distribution → Analytics",
      sourceId: distributionPlan?.id ?? "missing-distribution-plan",
      targetId: "metric-distribution",
      status:
        distributionPlan &&
        sources.phase3.analytics.metrics.some(
          (item) => item.id === "metric-distribution",
        )
          ? "VALID"
          : "BROKEN",
      detail: "Phase 3 distribution truth projected into analytics",
    },
    {
      id: "integrity-analytics-attribution",
      relationship: "Analytics → Attribution",
      sourceId: "metric-attribution",
      targetId: attributionJourney?.id ?? "missing-attribution",
      status:
        sources.phase3.analytics.metrics.some(
          (item) => item.id === "metric-attribution",
        ) && attributionJourney
          ? "VALID"
          : "BROKEN",
      detail: "Phase 3 analytics metric to attribution journey",
    },
    {
      id: "integrity-attribution-learning",
      relationship: "Attribution → Learning",
      sourceId: attributionJourney?.id ?? "missing-attribution",
      targetId: nextStrategyMemory?.id ?? "missing-learning",
      status: attributionJourney && nextStrategyMemory ? "VALID" : "BROKEN",
      detail: "Attribution caveat feeds inspectable Phase 5 learning",
    },
    {
      id: "integrity-memory-next-strategy",
      relationship: "Memory → Next Strategy",
      sourceId: nextStrategyMemory?.id ?? "missing-memory",
      targetId: firstStrategy?.id ?? "missing-strategy",
      status:
        nextStrategyMemory &&
        firstStrategy &&
        nextStrategyMemory.applicability.includes(firstStrategy.id)
          ? "VALID"
          : "BROKEN",
      detail: "Memory applicability returns to human-reviewed strategy",
    },
    {
      id: "integrity-strategy-autonomy",
      relationship: "Strategy → Autonomy Policy",
      sourceId: firstStrategy?.id ?? "missing-strategy",
      targetId: autonomyPolicy?.id ?? "missing-autonomy-policy",
      status: firstStrategy && autonomyPolicy ? "VALID" : "BROKEN",
      detail: "Phase 4 strategy linked to Phase 5 policy simulation",
    },
    {
      id: "integrity-autonomy-scenario",
      relationship: "Autonomy Policy → Scenario",
      sourceId: autonomyPolicy?.id ?? "missing-autonomy-policy",
      targetId: scenario?.id ?? "missing-scenario",
      status: autonomyPolicy && scenario ? "VALID" : "BROKEN",
      detail: "Simulated policy context linked to what-if scenario",
    },
    {
      id: "integrity-scenario-cost",
      relationship: "Scenario → Cost",
      sourceId: scenario?.id ?? "missing-scenario",
      targetId: costOption?.id ?? "missing-cost-option",
      status: scenario && costOption ? "VALID" : "BROKEN",
      detail: "Balanced scenario linked to estimated strategy economics",
    },
    {
      id: "integrity-cost-decision",
      relationship: "Cost → Human Decision",
      sourceId: costOption?.id ?? "missing-cost-option",
      targetId: humanDecision?.id ?? "missing-decision",
      status: costOption && humanDecision ? "VALID" : "BROKEN",
      detail: "Estimated cost remains subject to human decision review",
    },
  ];
  integrity.push(...chainChecks);

  const broken = integrity.filter((item) => item.status === "BROKEN");
  if (broken.length)
    throw new Error(`Cross-phase integrity contains ${broken.length} broken links.`);

  const journey = sources.phase3.analytics.attribution[0];
  const attribution = {
    id: journey?.id ?? "attribution-unavailable",
    label: journey?.label ?? "Attribution path",
    causality: "NOT_ESTABLISHED" as const,
    stages: (journey?.stages ?? [
      { stage: "CONTENT" as const, state: "UNKNOWN" as const, value: "UNAVAILABLE", evidence: "No attribution source.", caveat: "Do not fabricate revenue attribution." },
      { stage: "DISTRIBUTION" as const, state: "UNKNOWN" as const, value: "UNAVAILABLE", evidence: "No distribution telemetry.", caveat: "OAuth is not publication." },
      { stage: "AUDIENCE" as const, state: "UNKNOWN" as const, value: "UNAVAILABLE", evidence: "No audience events.", caveat: "No person was observed." },
      { stage: "CONVERSION" as const, state: "UNKNOWN" as const, value: "UNAVAILABLE", evidence: "No conversion contract.", caveat: "No conversion can be attributed." },
      { stage: "REVENUE" as const, state: "UNKNOWN" as const, value: "UNAVAILABLE", evidence: "No billing source.", caveat: "No revenue claim is possible." },
    ]).map((stage) => ({
      stage: stage.stage,
      value: stage.value,
      state: stage.state,
      evidence: stage.evidence,
      caveat: stage.caveat,
      executionReality:
        stage.state === "UNKNOWN" || stage.value === "Unavailable"
          ? ("UNAVAILABLE" as const)
          : stage.state === "ESTIMATED"
            ? ("ESTIMATED" as const)
            : ("FIXTURE" as const),
    })),
    provenance: journey?.provenance ?? unavailableProvenance,
    classification: journey ? ("FIXTURE" as const) : ("UNAVAILABLE" as const),
  };

  const phases: ExecutivePhaseStatus[] = [
    { id: "PHASE_01", label: "Foundation", status: "CERTIFIED", note: "Authoritative previous-phase status. This view does not recertify.", mutable: false },
    { id: "PHASE_02", label: "Growth Intelligence", status: "CERTIFIED", note: "Authoritative previous-phase status. This view does not recertify.", mutable: false },
    { id: "PHASE_03", label: "Distribution / Analytics", status: "PARTIALLY CERTIFIED", note: "YouTube OAuth path is not complete real-distribution certification.", mutable: false },
    { id: "PHASE_04", label: "Publishing", status: "CERTIFIED", note: "Publishing controls remain authoritative. Command Center cannot bypass them.", mutable: false },
    { id: "PHASE_05", label: "Autonomy / Memory / Cost", status: "IMPLEMENTED", note: "Runtime verification from Windows is authoritative. Not auto-certified by this dashboard.", mutable: false },
    { id: "PHASE_06", label: "Executive Command Center", status: "PENDING", note: "Frontend certification is informational here and is not mutated by this UI.", mutable: false },
  ];

  const governance: ExecutiveGovernance = {
    killSwitch: {
      state: sources.phase5.killSwitch.state,
      source: "NOT_FETCHED",
      blocksPublishingSchedule: false,
      executionReality: "PENDING",
      note: "Kill-switch ENGAGED blocks Phase 04 schedule. This dashboard cannot disarm it.",
    },
    autonomy: {
      globalLevel: null,
      source: "NOT_FETCHED",
      domains: sources.phase5.autonomyDomains.map((domain) => ({
        id: domain.id,
        label: domain.label,
        level: domain.level,
        approvalRequirement: domain.approvalRequirement,
        source: "NOT_FETCHED" as const,
        executionReality: "FIXTURE" as const,
      })),
      grantsAutonomy: false,
    },
    publishing: {
      chain: ["CONTENT", "BRAND IDENTITY", "BRAND VALIDATION", "POLICY VALIDATION", "APPROVAL WHERE REQUIRED", "PHASE 04 PUBLISHING", "PROVIDER"],
      bypass: false,
      note: "No executive action publishes, schedules, or spends.",
    },
    branding: {
      required: true,
      missingBlocksPublish: true,
      note: "Missing Agbofa brand identity blocks publish. Phase 06 cannot bypass branding.",
    },
    memoryPrivilege: {
      memoryIsData: true,
      canGrantRbac: false,
      canApprovePublish: false,
      canDisableSafety: false,
      note: "Memory cannot grant RBAC, approve publishing or spending, or disable safety systems.",
    },
    scenarios: {
      kind: "PROJECTED",
      historicalActuals: false,
      note: "Scenarios are PROJECTED, not historical actuals.",
    },
    cost: {
      kind: "ESTIMATED",
      invoices: false,
      note: "AI cost remains ESTIMATED. Not invoices or provider billing.",
    },
  };

  const data: ExecutiveCommandData = {
    architectureVersion: "phase-6-executive-command-v2",
    situation,
    metrics,
    opportunities,
    strategies,
    decisions,
    workforce,
    experiments,
    economics,
    learning,
    activity,
    loop,
    capabilities,
    searchIndex,
    integrity,
    attribution,
    phases,
    governance,
    liveSources: {
      session: "NOT_FETCHED",
      autonomyControl: "NOT_FETCHED",
      cost: "NOT_FETCHED",
      memory: "NOT_FETCHED",
      scenarios: "NOT_FETCHED",
      accounts: "NOT_FETCHED",
      distributions: "NOT_FETCHED",
    },
    provenance: aggregateProvenance,
  };
  const state = demoDataState(data, aggregateProvenance.source);
  return {
    ...state,
    confidence: {
      score: 100,
      basis: "Cross-phase relationship and authority validation, not production confidence",
      kind: "evidence",
    },
    provenance: aggregateProvenance,
  };
}
