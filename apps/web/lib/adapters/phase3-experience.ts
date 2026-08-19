import { demoDataState, type DataState } from "@/types/data-state";
import {
  PHASE3_PLATFORMS,
  type Phase3ExperienceData,
} from "@/types/phase3-experience";

interface CanonicalSources {
  stories: readonly { id: string; headline: string }[];
  agents: readonly { id: string; name: string }[];
}

function assertSetCoverage<T extends string | number>(
  actual: ReadonlySet<T>,
  expected: readonly T[],
  label: string,
) {
  for (const item of expected) {
    if (!actual.has(item)) throw new Error(`Missing ${label}: ${item}`);
  }
}

export function adaptPhase3Experience(
  fixture: Phase3ExperienceData,
  sources: CanonicalSources,
): DataState<Phase3ExperienceData> {
  if (fixture.canonicalAgentCount !== 28 || sources.agents.length !== 28)
    throw new Error("Phase 3 requires the canonical 28-agent registry.");

  const storyIds = new Set(sources.stories.map((item) => item.id));
  const agentIds = new Set(sources.agents.map((item) => item.id));
  const accountIds = new Set(fixture.distribution.accounts.map((item) => item.id));
  const platforms = new Set(
    fixture.distribution.platformRules.map((item) => item.platform),
  );
  assertSetCoverage(platforms, PHASE3_PLATFORMS, "platform rule");

  const brandPlatforms = new Set(
    fixture.distribution.accounts
      .filter((item) => item.scope === "BRAND")
      .map((item) => item.platform),
  );
  assertSetCoverage(brandPlatforms, PHASE3_PLATFORMS, "brand account state");

  for (const plan of fixture.distribution.publishingPlans) {
    if (!storyIds.has(plan.storyId))
      throw new Error(`Missing canonical story for publishing plan: ${plan.storyId}`);
    if (!accountIds.has(plan.accountId))
      throw new Error(`Missing account for publishing plan: ${plan.accountId}`);
    if (plan.truth !== "SIMULATED")
      throw new Error(`Publishing plan must be simulated: ${plan.id}`);
  }
  if (fixture.distribution.publishingTransitions.some((item) => item.externalEffect))
    throw new Error("Phase 3 publishing transitions cannot have external effects.");

  const horizons = new Set(
    fixture.analytics.forecasts.map((item) => item.horizonDays),
  );
  assertSetCoverage(horizons, [30, 60, 90] as const, "forecast horizon");
  if (fixture.analytics.forecasts.some((item) => item.guarantee))
    throw new Error("Forecasts cannot guarantee outcomes.");

  for (const journey of fixture.analytics.attribution) {
    if (!storyIds.has(journey.storyId))
      throw new Error(`Missing canonical attribution story: ${journey.storyId}`);
    const stages = journey.stages.map((item) => item.stage).join(">");
    if (stages !== "CONTENT>DISTRIBUTION>AUDIENCE>CONVERSION>REVENUE")
      throw new Error(`Invalid attribution order: ${journey.id}`);
    if (journey.causality !== "NOT_ESTABLISHED")
      throw new Error(`Unsupported causal claim: ${journey.id}`);
  }

  for (const experiment of fixture.experimentation.experiments) {
    if (!agentIds.has(experiment.agentId))
      throw new Error(`Missing canonical experiment agent: ${experiment.agentId}`);
    const allocation = experiment.variants.reduce(
      (total, variant) => total + variant.allocationPercent,
      0,
    );
    if (allocation !== 100)
      throw new Error(`Experiment allocation must equal 100: ${experiment.id}`);
    if (experiment.execution !== "SIMULATED_ONLY")
      throw new Error(`Real experiment execution is prohibited: ${experiment.id}`);
    if (!experiment.result) continue;
    const controlRate =
      (experiment.result.controlConversions / experiment.result.controlSample) * 100;
    const variantRate =
      (experiment.result.variantConversions / experiment.result.variantSample) * 100;
    const lift = ((variantRate - controlRate) / controlRate) * 100;
    if (
      Math.abs(controlRate - experiment.result.controlRate) > 0.02 ||
      Math.abs(variantRate - experiment.result.variantRate) > 0.02 ||
      Math.abs(lift - experiment.result.relativeLift) > 0.15
    )
      throw new Error(`Incoherent experiment rates: ${experiment.id}`);
    const intervalCrossesZero =
      experiment.result.confidenceInterval.minimum <= 0 &&
      experiment.result.confidenceInterval.maximum >= 0;
    if (
      experiment.result.statisticallySignificant ===
      (intervalCrossesZero ||
        experiment.result.pValue >= experiment.result.significanceThreshold)
    )
      throw new Error(`Incoherent significance state: ${experiment.id}`);
  }

  const state = demoDataState(fixture, fixture.provenance.source);
  return {
    ...state,
    confidence: {
      score: 100,
      basis: "Deterministic contract integrity; not outcome confidence",
      kind: "evidence",
    },
    provenance: fixture.provenance,
  };
}
