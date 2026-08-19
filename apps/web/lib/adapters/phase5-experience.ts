import { demoDataState, type DataState } from "@/types/data-state";
import type { AIControlData } from "@/types/ai-control";
import type { Agent } from "@/types/agents";
import type { GrowthIntelligenceData } from "@/types/growth-intelligence";
import type { Phase3ExperienceData } from "@/types/phase3-experience";
import type {
  AutonomyDomainId,
  ModelCandidate,
  Phase5ExperienceData,
  Phase5ExperienceFixture,
} from "@/types/phase5-experience";
import type { StrategyDirectorFixture } from "@/types/strategy-director";

interface Phase5Sources {
  agents: readonly Agent[];
  growth: GrowthIntelligenceData;
  phase3: Phase3ExperienceData;
  strategy: StrategyDirectorFixture;
  aiControl: AIControlData;
}

const requiredDomains: AutonomyDomainId[] = [
  "STRATEGY",
  "CONTENT",
  "DISTRIBUTION",
  "PUBLISHING",
  "EXPERIMENTS",
  "PAID_GROWTH",
];

function close(first: number, second: number, tolerance = 0.0001) {
  return Math.abs(first - second) <= tolerance;
}

export function adaptPhase5Experience(
  fixture: Phase5ExperienceFixture,
  sources: Phase5Sources,
): DataState<Phase5ExperienceData> {
  if (sources.agents.length !== 28)
    throw new Error("Phase 5 requires the canonical 28-agent registry.");
  if (JSON.stringify(fixture).includes('"executionReality":"ACTUAL"'))
    throw new Error("ACTUAL execution is unavailable in Phase 5.");

  const agentIds = new Set(sources.agents.map((agent) => agent.id));
  const strategies = new Map(
    sources.strategy.plans.map((strategy) => [strategy.id, strategy]),
  );
  const initiatives = new Map(
    sources.strategy.plans
      .flatMap((strategy) => strategy.initiatives)
      .map((initiative) => [initiative.id, initiative]),
  );
  const tasks = new Map(
    sources.strategy.plans
      .flatMap((strategy) => strategy.initiatives)
      .flatMap((initiative) => initiative.tasks)
      .map((task) => [task.id, task]),
  );
  const decisions = new Set(
    sources.strategy.decisions.map((decision) => decision.id),
  );
  const growthIds = new Set([
    ...sources.growth.opportunities.map((item) => item.id),
    ...sources.growth.evidence.map((item) => item.id),
  ]);
  const analyticsIds = new Set(
    sources.phase3.analytics.metrics.map((item) => item.id),
  );
  const experimentIds = new Set(
    sources.phase3.experimentation.experiments.map((item) => item.id),
  );

  const levelSet = new Set(fixture.levelDefinitions.map((item) => item.level));
  if (
    fixture.levelDefinitions.length !== 6 ||
    ![0, 1, 2, 3, 4, 5].every((level) => levelSet.has(level as 0))
  )
    throw new Error("Autonomy levels 0–5 must be represented exactly once.");
  const domainSet = new Set(fixture.autonomyDomains.map((item) => item.id));
  if (
    fixture.autonomyDomains.length !== requiredDomains.length ||
    !requiredDomains.every((domain) => domainSet.has(domain))
  )
    throw new Error("All six autonomy domains are required.");
  for (const domain of fixture.autonomyDomains) {
    if (domain.level < 0 || domain.level > 5)
      throw new Error(`Invalid autonomy level: ${domain.id}`);
    if (domain.backendEnforcement !== "UNAVAILABLE")
      throw new Error(`Backend enforcement claim prohibited: ${domain.id}`);
  }
  for (const policy of fixture.approvalPolicies) {
    if (!domainSet.has(policy.domain))
      throw new Error(`Approval policy references unknown domain: ${policy.id}`);
    if (policy.backendEnforcement !== "UNAVAILABLE")
      throw new Error(`Approval enforcement claim prohibited: ${policy.id}`);
  }

  const runIds = new Set(fixture.runs.map((run) => run.id));
  if (runIds.size !== fixture.runs.length)
    throw new Error("Run IDs must be unique.");
  for (const run of fixture.runs) {
    if (!strategies.has(run.strategyId) || !initiatives.has(run.initiativeId))
      throw new Error(`Invalid run strategy relationship: ${run.id}`);
    for (const taskId of run.taskIds)
      if (!tasks.has(taskId)) throw new Error(`Invalid run task: ${taskId}`);
    for (const agentId of run.agentIds)
      if (!agentIds.has(agentId)) throw new Error(`Invalid run agent: ${agentId}`);
    if (
      run.progress < 0 ||
      run.progress > 100 ||
      (run.estimatedBudget.amount !== null &&
        run.estimatedCost > run.estimatedBudget.amount)
    )
      throw new Error(`Incoherent run progress or budget: ${run.id}`);
  }

  const memoryIds = new Set(fixture.memories.map((memory) => memory.id));
  if (memoryIds.size !== fixture.memories.length)
    throw new Error("Memory IDs must be unique.");
  for (const memory of fixture.memories) {
    if (!memory.evidence.length)
      throw new Error(`Memory requires evidence: ${memory.id}`);
    for (const evidence of memory.evidence) {
      const valid =
        (evidence.sourceType === "GROWTH" && growthIds.has(evidence.sourceId)) ||
        (evidence.sourceType === "ANALYTICS" &&
          analyticsIds.has(evidence.sourceId)) ||
        (evidence.sourceType === "EXPERIMENT" &&
          experimentIds.has(evidence.sourceId)) ||
        (evidence.sourceType === "STRATEGY" &&
          (strategies.has(evidence.sourceId) || decisions.has(evidence.sourceId))) ||
        (evidence.sourceType === "RUN_SIMULATION" &&
          runIds.has(evidence.sourceId));
      if (!valid)
        throw new Error(`Invalid memory evidence: ${memory.id}/${evidence.id}`);
    }
    for (const conflictId of memory.conflictIds)
      if (!fixture.memoryConflicts.some((conflict) => conflict.id === conflictId))
        throw new Error(`Missing memory conflict: ${conflictId}`);
  }
  for (const conflict of fixture.memoryConflicts) {
    if (
      conflict.memoryIds[0] === conflict.memoryIds[1] ||
      !conflict.memoryIds.every((id) => memoryIds.has(id))
    )
      throw new Error(`Invalid memory conflict: ${conflict.id}`);
  }

  const scenarioIds = new Set(fixture.scenarios.map((scenario) => scenario.id));
  for (const scenario of fixture.scenarios) {
    if (
      scenario.baselineScenarioId !== null &&
      !scenarioIds.has(scenario.baselineScenarioId)
    )
      throw new Error(`Missing scenario baseline: ${scenario.id}`);
    const ranges = [
      scenario.projection.audience,
      scenario.projection.cost,
      scenario.projection.engagement,
      scenario.projection.reach,
    ];
    if (ranges.some((range) => range.minimum > range.maximum))
      throw new Error(`Invalid scenario range: ${scenario.id}`);
    if (
      scenario.projection.revenue.value !== null ||
      scenario.projection.roi.value !== null
    )
      throw new Error(`Unsupported scenario financial claim: ${scenario.id}`);
  }

  const catalog = new Map<
    string,
    { providerId: string; name: string; unavailable: boolean }
  >();
  for (const provider of sources.aiControl.providers)
    for (const model of provider.models)
      catalog.set(model.id, {
        providerId: provider.id,
        name: model.name,
        unavailable: model.availability === "unavailable",
      });
  const modelCandidates: ModelCandidate[] = fixture.modelCandidates.map(
    (seed) => {
      const model = catalog.get(seed.modelId);
      if (!model) throw new Error(`Missing canonical model catalog ID: ${seed.modelId}`);
      return {
        ...seed,
        providerId: model.providerId,
        modelName: model.name,
        availability: model.unavailable ? "UNAVAILABLE" : "CATALOG",
      };
    },
  );
  const candidateMap = new Map(
    modelCandidates.map((candidate) => [candidate.modelId, candidate]),
  );
  for (const route of fixture.routingSimulations) {
    if (!tasks.has(route.taskId))
      throw new Error(`Routing simulation references unknown task: ${route.id}`);
    for (const candidateId of route.candidateModelIds)
      if (!candidateMap.has(candidateId))
        throw new Error(`Routing simulation missing candidate: ${candidateId}`);
    const selected = candidateMap.get(route.selectedModelId);
    if (!selected || selected.availability === "UNAVAILABLE")
      throw new Error(`Routing simulation selected unavailable model: ${route.id}`);
    const computed = Number(
      (
        (route.estimatedInputTokens / 1_000_000) *
          selected.estimatedInputRatePerMillion +
        (route.estimatedOutputTokens / 1_000_000) *
          selected.estimatedOutputRatePerMillion
      ).toFixed(4),
    );
    if (
      !close(computed, route.estimatedCost) ||
      route.expectedQuality !== selected.estimatedQuality ||
      route.latencyClass !== selected.latencyClass
    )
      throw new Error(`Incoherent routing estimate: ${route.id}`);
  }

  for (const cost of fixture.taskCosts) {
    const route = fixture.routingSimulations.find(
      (item) => item.taskId === cost.taskId,
    );
    if (
      !route ||
      route.selectedModelId !== cost.modelId ||
      !close(route.estimatedCost, cost.estimatedCost)
    )
      throw new Error(`Task cost does not reconcile: ${cost.id}`);
    for (const agentId of cost.agentIds)
      if (!agentIds.has(agentId))
        throw new Error(`Task cost references unknown agent: ${cost.id}`);
  }
  for (const strategy of sources.strategy.plans) {
    const modes = new Set(
      fixture.costAwareStrategies
        .filter((item) => item.strategyId === strategy.id)
        .map((item) => item.mode),
    );
    if (!(["HIGH_QUALITY", "BALANCED", "LOW_COST"] as const).every((mode) => modes.has(mode)))
      throw new Error(`Missing cost-aware strategy mode: ${strategy.id}`);
  }
  for (const plan of fixture.budgetPlans) {
    const mix = plan.estimatedModelMix.reduce(
      (total, item) => total + item.percent,
      0,
    );
    if (mix !== 100 || plan.estimatedCost > plan.budget)
      throw new Error(`Invalid budget simulation: ${plan.id}`);
    for (const item of plan.estimatedModelMix)
      if (!candidateMap.has(item.modelId))
        throw new Error(`Budget references unknown model: ${plan.id}`);
  }

  if (
    fixture.financialTruth.actualCost.value !== null ||
    fixture.financialTruth.actualRevenue.value !== null ||
    fixture.financialTruth.verifiedRoi.value !== null ||
    fixture.financialTruth.estimatedRoi.value !== null
  )
    throw new Error("Actual financial truth and ROI must remain unavailable.");
  if (fixture.overrideHistory !== sources.strategy.overrideHistory)
    throw new Error("Phase 5 must reuse the Phase 4 override history owner.");

  const data: Phase5ExperienceData = {
    ...fixture,
    canonicalAgentCount: 28,
    modelCandidates,
  };
  const state = demoDataState(data, fixture.provenance.source);
  return {
    ...state,
    confidence: {
      score: 100,
      basis: "Deterministic relationship integrity; not outcome certainty",
      kind: "evidence",
    },
    provenance: fixture.provenance,
  };
}
