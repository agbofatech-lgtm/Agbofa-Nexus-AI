"use client";

import { GrowthPageHeader } from "@/components/features/growth/GrowthPageHeader";
import { GrowthWorkspaceNav } from "@/components/features/growth/GrowthWorkspaceNav";
import { StrategyDirectorOverview } from "@/components/features/strategy/StrategyDirectorOverview";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useStrategyDirector } from "@/hooks/useStrategyDirector";

export function StrategyDirectorExperience() {
  const workspace = useStrategyDirector();
  const flags = useFeatureFlags();
  const shell = (content: React.ReactNode) => (
    <main className="growth-os-page strategy-os-page">
      <GrowthPageHeader
        eyebrow="Phase 4 · Strategy Director"
        provenance={workspace.data?.provenance}
        subtitle="Translate Growth and Phase 3 intelligence into evidence-backed recommendations, human decisions, and simulated 30-day plans."
        title="Strategy Director"
      />
      <GrowthWorkspaceNav />
      {content}
    </main>
  );
  if (!flags.isEnabled("strategyDirector"))
    return shell(
      <CapabilityBoundary
        detail="The Strategy Director experience flag is disabled. No hidden strategy execution exists."
        title="Strategy Director unavailable"
      />,
    );
  if (workspace.loading) return shell(<WorkspaceState state="loading" />);
  if (workspace.error || !workspace.data)
    return shell(
      <WorkspaceState
        message={workspace.error ?? "Strategy Director unavailable."}
        onRetry={workspace.retry}
        state="error"
      />,
    );
  return shell(
    <>
      <StrategyDirectorOverview data={workspace.data} />
      <CapabilityBoundary
        detail="Nexus recommends. A human reviews and decides. The system visualizes simulated plans only. No strategy, task, agent, approval, publishing, provider, or financial execution occurs."
        dependency="Authorized orchestration, policy, audit, approval, and execution services"
        reality="simulation"
        state="simulated"
        title="Strategy is not execution"
      />
    </>,
  );
}
