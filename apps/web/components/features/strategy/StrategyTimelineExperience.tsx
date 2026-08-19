"use client";

import { GrowthPageHeader } from "@/components/features/growth/GrowthPageHeader";
import { GrowthWorkspaceNav } from "@/components/features/growth/GrowthWorkspaceNav";
import { StrategyTimeline } from "@/components/features/strategy/StrategyTimeline";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useStrategyDirector } from "@/hooks/useStrategyDirector";

export function StrategyTimelineExperience() {
  const workspace = useStrategyDirector();
  const flags = useFeatureFlags();
  const shell = (content: React.ReactNode) => (
    <main className="growth-os-page strategy-os-page">
      <GrowthPageHeader
        eyebrow="Phase 4 · Planned Sequence"
        provenance={workspace.data?.provenance}
        subtitle="Inspect a deterministic 30-day plan by day or week, filter relationships, and drill into simulated task details."
        title="Strategy Timeline"
      />
      <GrowthWorkspaceNav />
      {content}
    </main>
  );
  if (!flags.isEnabled("strategyDirector"))
    return shell(<CapabilityBoundary detail="The Strategy Director experience flag is disabled." title="Timeline unavailable" />);
  if (workspace.loading) return shell(<WorkspaceState state="loading" />);
  if (workspace.error || !workspace.data)
    return shell(<WorkspaceState message={workspace.error ?? "Strategy Timeline unavailable."} onRetry={workspace.retry} state="error" />);
  return shell(
    <>
      <StrategyTimeline plans={workspace.data.plans} timeline={workspace.data.timeline} workforce={workspace.data.workforce} />
      <CapabilityBoundary detail="Timeline completion, progress, and dates are simulated planning states. They are not scheduler, job, or runtime telemetry." reality="simulation" state="simulated" title="Timeline execution boundary" />
    </>,
  );
}
