import type {
  ExecutionFeatureFlag,
  FeatureFlagMap,
  FrontendFeatureFlag,
} from "@/types/feature-flags";

export const frontendFeatureFlags: FeatureFlagMap<FrontendFeatureFlag> = {
  growth: true,
  strategyDirector: false,
  opportunities: true,
  contentDNA: true,
  audienceIntelligence: true,
  competitorIntelligence: true,
  experiments: false,
  autonomy: false,
  memory: false,
  attribution: false,
  scenarioSimulation: false,
  aiRouting: false,
  distribution: true,
  analytics: true,
  monetization: true,
};

export const executionFeatureFlags: FeatureFlagMap<ExecutionFeatureFlag> = {
  strategyExecution: false,
  autonomousExecution: false,
  paidExecution: false,
  realPublishing: false,
  realProviderRouting: false,
};

export function isFrontendFeatureEnabled(flag: FrontendFeatureFlag): boolean {
  return frontendFeatureFlags[flag];
}
export function isExecutionEnabled(flag: ExecutionFeatureFlag): boolean {
  return executionFeatureFlags[flag];
}
