export type FrontendFeatureFlag =
  | "growth"
  | "strategyDirector"
  | "decisions"
  | "agents"
  | "opportunities"
  | "contentDNA"
  | "audienceIntelligence"
  | "competitorIntelligence"
  | "experiments"
  | "autonomy"
  | "memory"
  | "attribution"
  | "scenarioSimulation"
  | "aiRouting"
  | "distribution"
  | "analytics"
  | "monetization";

export type ExecutionFeatureFlag =
  | "strategyExecution"
  | "autonomousExecution"
  | "paidExecution"
  | "realPublishing"
  | "realProviderRouting";

export type FeatureFlagMap<T extends string> = Readonly<Record<T, boolean>>;
