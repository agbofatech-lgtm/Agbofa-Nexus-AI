import { demoDataState, type DataState } from "@/types/data-state";
import type { GrowthIntelligenceData } from "@/types/growth-intelligence";
import type { Phase3ExperienceData } from "@/types/phase3-experience";
import type {
  StrategyDirectorData,
  StrategyDirectorFixture,
  StrategyTask,
  WorkforceAgentProjection,
  WorkforceStatus,
} from "@/types/strategy-director";
import type { Agent } from "@/types/agents";

interface StrategySources {
  agents: readonly Agent[];
  stories: readonly { id: string; headline: string }[];
  growth: GrowthIntelligenceData;
  phase3: Phase3ExperienceData;
}

function approximateEqual(first: number, second: number, tolerance = 1) {
  return Math.abs(first - second) <= tolerance;
}

function workforceStatus(tasks: StrategyTask[]): WorkforceStatus {
  const priority: StrategyTask["status"][] = [
    "FAILED",
    "BLOCKED",
    "WAITING_APPROVAL",
    "WORKING",
    "PLANNED",
    "COMPLETED",
  ];
  const state = priority.find((candidate) =>
    tasks.some((task) => task.status === candidate),
  );
  if (!state) return "IDLE";
  return state === "PLANNED" ? "IDLE" : state;
}

function projectWorkforce(
  agents: readonly Agent[],
  tasks: StrategyTask[],
  provenance: StrategyDirectorFixture["provenance"],
): WorkforceAgentProjection[] {
  return agents.map((agent) => {
    const assigned = tasks.filter((task) => task.agentIds.includes(agent.id));
    const current =
      assigned.find((task) =>
        ["WORKING", "BLOCKED", "WAITING_APPROVAL"].includes(task.status),
      ) ??
      assigned.find((task) => task.status === "PLANNED") ??
      assigned[0] ??
      null;
    const dependencyTaskIds = new Set(
      assigned.flatMap((task) => task.dependencyTaskIds),
    );
    const dependencyAgentIds = tasks
      .filter((task) => dependencyTaskIds.has(task.id))
      .flatMap((task) => task.agentIds)
      .filter((id) => id !== agent.id);
    const estimatedAmount = assigned.reduce(
      (total, task) =>
        total + (task.estimatedCost.amount ?? 0) / task.agentIds.length,
      0,
    );
    return {
      agent,
      status: workforceStatus(assigned),
      currentTask: current,
      progress: assigned.length
        ? Math.round(
            assigned.reduce((total, task) => total + task.progress, 0) /
              assigned.length,
          )
        : 0,
      confidence: {
        score: assigned.length
          ? Math.round(
              assigned.reduce(
                (total, task) => total + task.confidence.score,
                0,
              ) / assigned.length,
            )
          : 100,
        basis: assigned.length
          ? "Average confidence across simulated strategy assignments"
          : "No Phase 4 assignment",
        kind: "model",
      },
      dependencyAgentIds: [...new Set(dependencyAgentIds)],
      outputs: [...new Set(assigned.flatMap((task) => task.outputs))],
      review: current?.review ?? "NOT_REQUIRED",
      estimatedCost: {
        amount: Math.round(estimatedAmount),
        currency: "USD",
        basis: "Allocated share of simulated task estimates; not actual spend",
        provenance,
      },
      error: assigned.some((task) => task.status === "FAILED")
        ? "Simulated task failure"
        : null,
      strategyIds: [...new Set(assigned.map((task) => task.strategyId))],
      provenance,
      executionReality: "SIMULATED",
    };
  });
}

export function adaptStrategyDirector(
  fixture: StrategyDirectorFixture,
  sources: StrategySources,
): DataState<StrategyDirectorData> {
  if (sources.agents.length !== 28)
    throw new Error("Phase 4 requires exactly 28 canonical agents.");
  if (JSON.stringify(fixture).includes('"ACTUAL"'))
    throw new Error("ACTUAL execution is unavailable in Phase 4.");

  const agentIds = new Set(sources.agents.map((agent) => agent.id));
  const storyIds = new Set(sources.stories.map((story) => story.id));
  const opportunityIds = new Set(
    sources.growth.opportunities.map((record) => record.id),
  );
  const growthEvidenceIds = new Set(
    sources.growth.evidence.map((record) => record.id),
  );
  const publishingPlanIds = new Set(
    sources.phase3.distribution.publishingPlans.map((record) => record.id),
  );
  const analyticsMetricIds = new Set(
    sources.phase3.analytics.metrics.map((record) => record.id),
  );
  const experimentIds = new Set(
    sources.phase3.experimentation.experiments.map((record) => record.id),
  );
  const strategyIds = new Set(fixture.plans.map((plan) => plan.id));
  const initiatives = fixture.plans.flatMap((plan) => plan.initiatives);
  const initiativeIds = new Set(initiatives.map((record) => record.id));
  const tasks = initiatives.flatMap((record) => record.tasks);
  const taskIds = new Set(tasks.map((record) => record.id));

  if (
    strategyIds.size !== fixture.plans.length ||
    initiativeIds.size !== initiatives.length ||
    taskIds.size !== tasks.length
  )
    throw new Error("Strategy, initiative, and task IDs must be unique.");

  for (const plan of fixture.plans) {
    if (plan.timelineDays !== 30)
      throw new Error(`Strategy must use the 30-day horizon: ${plan.id}`);
    const initiativeCost = plan.initiatives.reduce(
      (total, item) => total + (item.estimatedCost.amount ?? 0),
      0,
    );
    const planTasks = plan.initiatives.flatMap((item) => item.tasks);
    const planProgress = Math.round(
      planTasks.reduce((total, item) => total + item.progress, 0) /
        planTasks.length,
    );
    if (
      !approximateEqual(initiativeCost, plan.estimatedCost.amount ?? -1, 0) ||
      !approximateEqual(planProgress, plan.progress)
    )
      throw new Error(`Incoherent strategy cost or progress: ${plan.id}`);
    for (const id of plan.crossDomain.opportunityIds)
      if (!opportunityIds.has(id))
        throw new Error(`Missing Growth opportunity: ${id}`);
    for (const id of plan.crossDomain.publishingPlanIds)
      if (!publishingPlanIds.has(id))
        throw new Error(`Missing Phase 3 publishing plan: ${id}`);
    for (const id of plan.crossDomain.analyticsMetricIds)
      if (!analyticsMetricIds.has(id))
        throw new Error(`Missing Phase 3 analytics metric: ${id}`);
    for (const id of plan.crossDomain.experimentIds)
      if (!experimentIds.has(id))
        throw new Error(`Missing Phase 3 experiment: ${id}`);
    for (const id of plan.crossDomain.storyIds)
      if (!storyIds.has(id)) throw new Error(`Missing canonical story: ${id}`);
  }

  const referencedAgents = new Set<string>();
  for (const item of initiatives) {
    if (!strategyIds.has(item.strategyId))
      throw new Error(`Missing strategy for initiative: ${item.id}`);
    for (const dependencyId of item.dependencyInitiativeIds)
      if (!initiativeIds.has(dependencyId))
        throw new Error(`Missing initiative dependency: ${dependencyId}`);
    const taskCost = item.tasks.reduce(
      (total, task) => total + (task.estimatedCost.amount ?? 0),
      0,
    );
    const progress = Math.round(
      item.tasks.reduce((total, task) => total + task.progress, 0) /
        item.tasks.length,
    );
    if (
      !approximateEqual(taskCost, item.estimatedCost.amount ?? -1, 0) ||
      !approximateEqual(progress, item.progress)
    )
      throw new Error(`Incoherent initiative cost or progress: ${item.id}`);
    for (const id of item.opportunityIds)
      if (!opportunityIds.has(id))
        throw new Error(`Missing initiative opportunity: ${id}`);
  }

  for (const item of tasks) {
    if (
      !strategyIds.has(item.strategyId) ||
      !initiativeIds.has(item.initiativeId)
    )
      throw new Error(`Invalid task parent: ${item.id}`);
    if (item.progress < 0 || item.progress > 100)
      throw new Error(`Invalid task progress: ${item.id}`);
    if (item.startDay < 1 || item.startDay + item.durationDays - 1 > 30)
      throw new Error(`Task outside 30-day timeline: ${item.id}`);
    for (const agentId of item.agentIds) {
      if (!agentIds.has(agentId))
        throw new Error(`Missing canonical agent: ${agentId}`);
      referencedAgents.add(agentId);
    }
    for (const dependencyId of item.dependencyTaskIds)
      if (!taskIds.has(dependencyId) || dependencyId === item.id)
        throw new Error(`Invalid task dependency: ${item.id}`);
  }
  if (referencedAgents.size !== 28)
    throw new Error("The strategy projection must involve all 28 canonical agents.");

  const pendingDecisions = fixture.decisions.filter((decision) =>
    ["PENDING", "REVIEW", "MODIFIED"].includes(decision.status),
  );
  if (pendingDecisions.length < 5 || pendingDecisions.length > 10)
    throw new Error("Decision queue must contain five to ten pending records.");
  for (const decision of fixture.decisions) {
    if (
      !strategyIds.has(decision.strategyId) ||
      !initiativeIds.has(decision.initiativeId) ||
      (decision.taskId !== null && !taskIds.has(decision.taskId))
    )
      throw new Error(`Invalid decision relationship: ${decision.id}`);
    if (!decision.evidence.length)
      throw new Error(`Decision requires evidence: ${decision.id}`);
    for (const record of decision.evidence)
      if (
        record.source === "Simulated Growth Intelligence" &&
        !growthEvidenceIds.has(record.id)
      )
        throw new Error(`Missing Growth evidence: ${record.id}`);
  }

  for (const stage of fixture.workflow) {
    for (const agentId of stage.agentIds)
      if (!agentIds.has(agentId))
        throw new Error(`Invalid workflow agent: ${agentId}`);
    for (const taskId of stage.taskIds)
      if (!taskIds.has(taskId))
        throw new Error(`Invalid workflow task: ${taskId}`);
  }
  for (const item of fixture.timeline) {
    if (
      !strategyIds.has(item.strategyId) ||
      !initiativeIds.has(item.initiativeId) ||
      !taskIds.has(item.taskId) ||
      !agentIds.has(item.agentId) ||
      item.day < 1 ||
      item.day + item.durationDays - 1 > 30
    )
      throw new Error(`Invalid timeline item: ${item.id}`);
  }

  const validOverrideTargets = new Set([
    ...strategyIds,
    ...initiativeIds,
    ...taskIds,
    ...agentIds,
  ]);
  for (const item of fixture.overrideHistory)
    if (!validOverrideTargets.has(item.targetId))
      throw new Error(`Invalid override target: ${item.id}`);

  const data: StrategyDirectorData = {
    ...fixture,
    canonicalAgentCount: 28,
    workforce: projectWorkforce(sources.agents, tasks, fixture.provenance),
  };
  const state = demoDataState(data, fixture.provenance.source);
  return {
    ...state,
    confidence: {
      score: 100,
      basis: "Deterministic relationship integrity; not execution confidence",
      kind: "evidence",
    },
    provenance: fixture.provenance,
  };
}
