import type { FrontendFeatureFlag } from "@/types/feature-flags";
export type FutureWorkspace = "growth" | "strategy" | "agents" | "autonomy";
export type WorkspaceReadiness =
  "existing" | "foundation" | "future" | "blocked";
export interface FutureWorkspaceRoute {
  id: string;
  label: string;
  href: string;
  workspace: FutureWorkspace;
  readiness: WorkspaceReadiness;
  featureFlag?: FrontendFeatureFlag;
  backendDependency?: string;
}
export const futureWorkspaceRoutes: readonly FutureWorkspaceRoute[] = [
  {
    id: "growth",
    label: "Growth",
    href: "/growth",
    workspace: "growth",
    readiness: "existing",
    featureFlag: "growth",
  },
  {
    id: "opportunities",
    label: "Opportunity Center",
    href: "/growth/opportunities",
    workspace: "growth",
    readiness: "existing",
    featureFlag: "opportunities",
  },
  {
    id: "trends",
    label: "Trend Radar",
    href: "/growth/trends",
    workspace: "growth",
    readiness: "existing",
  },
  {
    id: "content-gap",
    label: "Content Gap",
    href: "/growth/content-gap",
    workspace: "growth",
    readiness: "existing",
    featureFlag: "contentDNA",
  },
  {
    id: "audience",
    label: "Audience Intelligence",
    href: "/growth/audience",
    workspace: "growth",
    readiness: "existing",
    featureFlag: "audienceIntelligence",
  },
  {
    id: "competitors",
    label: "Competitor Intelligence",
    href: "/growth/competitors",
    workspace: "growth",
    readiness: "existing",
    featureFlag: "competitorIntelligence",
  },
  {
    id: "strategy",
    label: "Strategy Director",
    href: "/growth/strategy",
    workspace: "strategy",
    readiness: "existing",
    featureFlag: "strategyDirector",
  },
  {
    id: "decisions",
    label: "Decision Center",
    href: "/growth/decisions",
    workspace: "strategy",
    readiness: "existing",
    featureFlag: "decisions",
  },
  {
    id: "timeline",
    label: "Strategy Timeline",
    href: "/growth/strategy/timeline",
    workspace: "strategy",
    readiness: "existing",
    featureFlag: "strategyDirector",
  },
  {
    id: "runs",
    label: "Autonomous Runs",
    href: "/growth/runs",
    workspace: "autonomy",
    readiness: "blocked",
    featureFlag: "autonomy",
    backendDependency: "Agent execution and authorization runtime",
  },
  {
    id: "memory",
    label: "AI Memory",
    href: "/growth/memory",
    workspace: "autonomy",
    readiness: "blocked",
    featureFlag: "memory",
    backendDependency: "Persistent tenant-scoped memory service",
  },
  {
    id: "scenarios",
    label: "Scenario Simulator",
    href: "/growth/scenarios",
    workspace: "strategy",
    readiness: "future",
    featureFlag: "scenarioSimulation",
  },
  {
    id: "autonomy",
    label: "Autonomy Control",
    href: "/ai-control/autonomy",
    workspace: "autonomy",
    readiness: "blocked",
    featureFlag: "autonomy",
    backendDependency: "Backend policy enforcement and kill switch",
  },
] as const;
