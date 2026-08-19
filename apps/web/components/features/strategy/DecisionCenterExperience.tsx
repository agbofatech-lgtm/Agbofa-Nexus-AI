"use client";

import { DecisionCenter } from "@/components/features/strategy/DecisionCenter";
import { GrowthPageHeader } from "@/components/features/growth/GrowthPageHeader";
import { GrowthWorkspaceNav } from "@/components/features/growth/GrowthWorkspaceNav";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useStrategyDirector } from "@/hooks/useStrategyDirector";

export function DecisionCenterExperience() {
  const workspace = useStrategyDirector();
  const flags = useFeatureFlags();
  const shell = (content: React.ReactNode) => (
    <main className="growth-os-page strategy-os-page">
      <GrowthPageHeader
        eyebrow="Phase 4 · Human Decision Layer"
        provenance={workspace.data?.provenance}
        subtitle="Review recommendation evidence, impact, estimated cost, simulated risk, and next action before changing local decision state."
        title="Decision Center"
      />
      <GrowthWorkspaceNav />
      {content}
    </main>
  );
  if (!flags.isEnabled("decisions"))
    return shell(<CapabilityBoundary detail="The canonical decision experience flag is disabled." title="Decision Center unavailable" />);
  if (workspace.loading) return shell(<WorkspaceState state="loading" />);
  if (workspace.error || !workspace.data)
    return shell(<WorkspaceState message={workspace.error ?? "Decision Center unavailable."} onRetry={workspace.retry} state="error" />);
  return shell(
    <>
      <DecisionCenter decisions={workspace.data.decisions} history={workspace.data.decisionHistory} />
      <CapabilityBoundary detail="Review, modification, approval, and rejection update local presentation state only. Approval is not backend authorization and cannot dispatch tasks or agents." reality="simulation" state="simulated" title="Decision execution unavailable" />
    </>,
  );
}
