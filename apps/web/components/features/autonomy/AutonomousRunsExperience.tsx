"use client";

import { AutonomousRunSimulator } from "@/components/features/autonomy/AutonomousRunSimulator";
import { GrowthPageHeader } from "@/components/features/growth/GrowthPageHeader";
import { GrowthWorkspaceNav } from "@/components/features/growth/GrowthWorkspaceNav";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { usePhase5Experience } from "@/hooks/usePhase5Experience";
import { useStrategyDirector } from "@/hooks/useStrategyDirector";

export function AutonomousRunsExperience() {
  const phase5 = usePhase5Experience();
  const strategy = useStrategyDirector();
  const flags = useFeatureFlags();
  const shell = (content: React.ReactNode) => (
    <main className="growth-os-page phase5-page">
      <GrowthPageHeader
        eyebrow="Phase 5 · Run Simulation"
        provenance={phase5.data?.provenance}
        subtitle="Inspect how a future policy-governed run could move through preparation, approval, review, and a simulated result without dispatching work."
        title="Autonomous Run Simulation"
      />
      <GrowthWorkspaceNav />
      {content}
    </main>
  );
  if (!flags.isEnabled("autonomy"))
    return shell(<CapabilityBoundary detail="The autonomy experience flag is disabled." title="Run simulation unavailable" />);
  if (phase5.loading || strategy.loading)
    return shell(<WorkspaceState state="loading" />);
  if (phase5.error || strategy.error || !phase5.data || !strategy.data)
    return shell(<WorkspaceState message={phase5.error ?? strategy.error ?? "Run simulation unavailable."} onRetry={() => { phase5.retry(); strategy.retry(); }} state="error" />);
  return shell(
    <>
      <AutonomousRunSimulator data={phase5.data} strategy={strategy.data} />
      <CapabilityBoundary detail="Run state is not runtime telemetry. Tasks are not dispatched. Agents are not orchestrated. Approval does not authorize execution. Outcomes are simulated records." reality="simulation" state="simulated" title="No autonomous runtime" />
    </>,
  );
}
