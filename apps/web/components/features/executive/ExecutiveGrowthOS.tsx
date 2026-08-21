"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { ExecutiveAttribution } from "@/components/features/executive/ExecutiveAttribution";
import { ExecutiveGovernance } from "@/components/features/executive/ExecutiveGovernance";
import { ExecutiveOperatingState } from "@/components/features/executive/ExecutiveOperatingState";
import { ExecutivePhaseMaturity } from "@/components/features/executive/ExecutivePhaseMaturity";
import { ExecutivePriorityDesk } from "@/components/features/executive/ExecutivePriorityDesk";
import { ExecutiveSituation } from "@/components/features/executive/ExecutiveSituation";
import { GrowthPageHeader } from "@/components/features/growth/GrowthPageHeader";
import { GrowthWorkspaceNav } from "@/components/features/growth/GrowthWorkspaceNav";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useExecutiveCommand } from "@/hooks/useExecutiveCommand";
import "@/lib/contracts/executive-command-contract-check";

const PreservedGrowthDashboard = dynamic(() =>
  import("@/components/features/growth/GrowthDashboard").then(
    (module) => module.GrowthDashboard,
  ),
);
const ExecutiveActivityCenter = dynamic(() =>
  import("@/components/features/executive/ExecutiveActivityCenter").then(
    (module) => module.ExecutiveActivityCenter,
  ),
);
const ExecutiveIntelligenceLoop = dynamic(() =>
  import("@/components/features/executive/ExecutiveIntelligenceLoop").then(
    (module) => module.ExecutiveIntelligenceLoop,
  ),
);
const ExecutiveCapabilityHealth = dynamic(() =>
  import("@/components/features/executive/ExecutiveCapabilityHealth").then(
    (module) => module.ExecutiveCapabilityHealth,
  ),
);

export function ExecutiveGrowthOS() {
  const executive = useExecutiveCommand();
  const [operationsOpen, setOperationsOpen] = useState(false);
  const shell = (content: ReactNode) => (
    <main className="growth-os-page executive-os-page">
      <GrowthPageHeader
        eyebrow="Phase 06 · Executive Command Center"
        provenance={executive.data?.provenance}
        subtitle="Summarize what is happening, what changed, what requires a decision, and what is simulated, estimated, projected, or unavailable. This surface does not execute."
        title="Executive Command Center"
      />
      <GrowthWorkspaceNav />
      {content}
    </main>
  );
  if (executive.loading) return shell(<WorkspaceState state="loading" />);
  if (executive.error || !executive.data)
    return shell(
      <WorkspaceState
        message={executive.error ?? "Executive command projection unavailable."}
        onRetry={executive.retry}
        state="error"
      />,
    );
  const data = executive.data;
  return shell(
    <>
      <div className="executive-stack">
        <ExecutiveSituation situation={data.situation} />
        <ExecutiveOperatingState
          economics={data.economics}
          experiments={data.experiments}
          learning={data.learning}
          metrics={data.metrics}
          workforce={data.workforce}
        />
        <ExecutivePriorityDesk
          decisions={data.decisions}
          opportunities={data.opportunities}
          strategies={data.strategies}
        />
        <ExecutiveAttribution attribution={data.attribution} />
        <ExecutiveGovernance governance={data.governance} liveSources={data.liveSources} />
        <ExecutiveActivityCenter events={data.activity} />
        <ExecutiveIntelligenceLoop loop={data.loop} />
        <ExecutiveCapabilityHealth
          capabilities={data.capabilities}
          integrity={data.integrity}
        />
        <ExecutivePhaseMaturity phases={data.phases} />
        <details
          className="preserved-growth-operations"
          onToggle={(event) => setOperationsOpen(event.currentTarget.open)}
        >
          <summary>Open preserved Growth operations workspace</summary>
          <div>
            <p>
              Phase 06 summarizes rather than removes the existing audience,
              campaign, retention, recommendation, funnel, and experiment views.
            </p>
            {operationsOpen ? <PreservedGrowthDashboard /> : null}
          </div>
        </details>
      </div>
      <CapabilityBoundary
        detail="The Executive Command Center aggregates existing systems. It cannot approve decisions, execute strategies, dispatch agents, publish content, route providers, treat memory as privilege, spend funds, or mutate external systems."
        reality="simulation"
        state="simulated"
        title="Executive information is not executive execution"
      />
    </>,
  );
}
