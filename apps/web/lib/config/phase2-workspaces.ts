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
    readiness: "future",
    featureFlag: "opportunities",
  },
  {
    id: "strategy",
    label: "Strategy Director",
    href: "/growth/strategy",
    workspace: "strategy",
    readiness: "foundation",
    featureFlag: "strategyDirector",
  },
  {
    id: "decisions",
    label: "Decision Center",
    href: "/growth/decisions",
    workspace: "strategy",
    readiness: "future",
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
