"use client";

import { GrowthPageHeader } from "@/components/features/growth/GrowthPageHeader";
import { GrowthWorkspaceNav } from "@/components/features/growth/GrowthWorkspaceNav";
import { ScenarioComparison } from "@/components/features/scenarios/ScenarioComparison";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { usePhase5Experience } from "@/hooks/usePhase5Experience";

export function ScenarioExperience() {
  const workspace = usePhase5Experience();
  const flags = useFeatureFlags();
  const shell = (content: React.ReactNode) => (
    <main className="growth-os-page phase5-page">
      <GrowthPageHeader
        eyebrow="Phase 5 · What-if Intelligence"
        provenance={workspace.data?.provenance}
        subtitle="Compare assumptions, ranges, quality, estimated cost, confidence, and risk without presenting a scenario as a guarantee."
        title="Scenario Intelligence"
      />
      <GrowthWorkspaceNav />
      {content}
    </main>
  );
  if (!flags.isEnabled("scenarioSimulation"))
    return shell(<CapabilityBoundary detail="The scenario experience flag is disabled. No hidden scenario engine exists." title="Scenario Intelligence unavailable" />);
  if (workspace.loading) return shell(<WorkspaceState state="loading" />);
  if (workspace.error || !workspace.data)
    return shell(<WorkspaceState message={workspace.error ?? "Scenario Intelligence unavailable."} onRetry={workspace.retry} state="error" />);
  return shell(
    <>
      <ScenarioComparison scenarios={workspace.data.scenarios} />
      <CapabilityBoundary detail="A what-if scenario is not a prediction guarantee. Revenue and ROI remain unavailable. Selecting variables does not execute a strategy or alter any system." dependency="Authoritative scenario, forecasting, attribution, and financial sources" reality="simulation" state="simulated" title="Scenario execution unavailable" />
    </>,
  );
}
