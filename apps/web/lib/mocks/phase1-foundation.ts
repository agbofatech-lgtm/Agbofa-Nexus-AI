import type { CapabilityState, ExecutionReality } from "@/types/capabilities";
import type {
  ExecutionFeatureFlag,
  FrontendFeatureFlag,
} from "@/types/feature-flags";
export interface FoundationCapabilityFixture {
  id: string;
  label: string;
  description: string;
  state: CapabilityState;
  reality: ExecutionReality;
  featureFlag?: FrontendFeatureFlag;
  executionFlag?: ExecutionFeatureFlag;
  dependency?: string;
}
export interface Phase1FoundationFixture {
  canonicalAgentCount: 28;
  architectureVersion: "phase-1-reconstruction-v1";
  source: string;
  detail: string;
  capabilities: FoundationCapabilityFixture[];
}
export const phase1FoundationFixture: Phase1FoundationFixture = {
  canonicalAgentCount: 28,
  architectureVersion: "phase-1-reconstruction-v1",
  source: "Phase 1 reconstruction frontend foundation fixture",
  detail:
    "Frontend capability metadata only. It does not represent strategy execution, autonomy, publishing, provider routing, or persistent memory.",
  capabilities: [
    {
      id: "growth",
      label: "Growth workspace",
      description: "Existing frontend Growth experience",
      state: "available",
      reality: "experience",
      featureFlag: "growth",
    },
    {
      id: "distribution",
      label: "Distribution workspace",
      description: "Existing frontend distribution presentation",
      state: "available",
      reality: "experience",
      featureFlag: "distribution",
    },
    {
      id: "analytics",
      label: "Analytics workspace",
      description: "Existing frontend analytics presentation",
      state: "available",
      reality: "experience",
      featureFlag: "analytics",
    },
    {
      id: "monetization",
      label: "Monetization workspace",
      description: "Development monetization presentation",
      state: "simulated",
      reality: "simulation",
      featureFlag: "monetization",
    },
    {
      id: "opportunities",
      label: "Opportunity Center",
      description: "Future Growth Intelligence capability",
      state: "comingSoon",
      reality: "experience",
      featureFlag: "opportunities",
    },
    {
      id: "strategy",
      label: "Strategy Director",
      description:
        "Simulated recommendations, plans, decisions, timelines, and workforce projections; execution engine unavailable",
      state: "simulated",
      reality: "simulation",
      featureFlag: "strategyDirector",
      executionFlag: "strategyExecution",
      dependency: "Backend strategy engine and approval service",
    },
    {
      id: "autonomy",
      label: "Autonomy",
      description: "Frontend policy contracts only",
      state: "blocked",
      reality: "execution-unavailable",
      featureFlag: "autonomy",
      executionFlag: "autonomousExecution",
      dependency: "Authorized agent runtime and enforcement service",
    },
    {
      id: "memory",
      label: "Persistent AI memory",
      description: "Frontend memory contracts only",
      state: "blocked",
      reality: "execution-unavailable",
      featureFlag: "memory",
      dependency: "Tenant-scoped persistent memory service",
    },
    {
      id: "publishing",
      label: "Real publishing",
      description: "Preview and local planning only",
      state: "requiresAuthorization",
      reality: "execution-unavailable",
      executionFlag: "realPublishing",
      dependency: "OAuth, BFF, platform APIs, and server authorization",
    },
    {
      id: "routing",
      label: "Real provider routing",
      description: "Provider/model UI only",
      state: "blocked",
      reality: "execution-unavailable",
      featureFlag: "aiRouting",
      executionFlag: "realProviderRouting",
      dependency: "Provider credentials and backend model router",
    },
  ],
};
