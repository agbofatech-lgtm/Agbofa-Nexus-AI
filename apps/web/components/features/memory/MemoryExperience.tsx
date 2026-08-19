"use client";

import { GrowthPageHeader } from "@/components/features/growth/GrowthPageHeader";
import { GrowthWorkspaceNav } from "@/components/features/growth/GrowthWorkspaceNav";
import { MemoryWorkspace } from "@/components/features/memory/MemoryWorkspace";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { usePhase5Experience } from "@/hooks/usePhase5Experience";

export function MemoryExperience() {
  const workspace = usePhase5Experience();
  const flags = useFeatureFlags();
  const shell = (content: React.ReactNode) => (
    <main className="growth-os-page phase5-page">
      <GrowthPageHeader
        eyebrow="Phase 5 · Memory & Learning"
        provenance={workspace.data?.provenance}
        subtitle="Inspect why Nexus would remember something, what evidence supports it, where conflicts exist, and when human review is required."
        title="Memory & Learning"
      />
      <GrowthWorkspaceNav />
      {content}
    </main>
  );
  if (!flags.isEnabled("memory"))
    return shell(<CapabilityBoundary detail="The memory experience flag is disabled. No hidden persistence exists." title="Memory unavailable" />);
  if (workspace.loading) return shell(<WorkspaceState state="loading" />);
  if (workspace.error || !workspace.data)
    return shell(<WorkspaceState message={workspace.error ?? "Memory experience unavailable."} onRetry={workspace.retry} state="error" />);
  return shell(
    <>
      <MemoryWorkspace conflicts={workspace.data.memoryConflicts} memories={workspace.data.memories} />
      <CapabilityBoundary detail="Memory display is not persistent memory. Review, archive, and conflict state changes remain local. No database, vector store, embedding, retrieval, synchronization, or write pipeline exists." dependency="Tenant-scoped governed memory and retrieval infrastructure" reality="simulation" state="simulated" title="Simulated memory boundary" />
    </>,
  );
}
