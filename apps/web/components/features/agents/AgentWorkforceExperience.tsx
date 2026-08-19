"use client";

import { DatabaseZap } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { AgentHeader } from "@/components/features/agents/AgentHeader";
import { AgentWorkforceNav } from "@/components/features/agents/AgentWorkforceNav";
import { AgentWorkforceTable } from "@/components/features/agents/AgentWorkforceTable";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useStrategyDirector } from "@/hooks/useStrategyDirector";

const AgentRegistryOperations = dynamic(() =>
  import("@/components/features/agents/AgentRegistryOperations").then(
    (module) => module.AgentRegistryOperations,
  ),
);

export function AgentWorkforceExperience() {
  const workspace = useStrategyDirector();
  const [preservedOperationsOpen, setPreservedOperationsOpen] = useState(false);
  const flags = useFeatureFlags();
  if (!flags.isEnabled("agents"))
    return <CapabilityBoundary detail="The canonical agent workforce experience flag is disabled." title="Agent Workforce unavailable" />;
  if (workspace.loading)
    return <div className="agents-page"><AgentHeader count={28} /><AgentWorkforceNav /><WorkspaceState state="loading" /></div>;
  if (workspace.error || !workspace.data)
    return <div className="agents-page"><AgentHeader count={28} /><AgentWorkforceNav /><WorkspaceState message={workspace.error ?? "Agent Workforce unavailable."} onRetry={workspace.retry} state="error" /></div>;
  const data = workspace.data;
  return (
    <main className="agents-page phase4-workforce-page">
      <AgentHeader count={data.canonicalAgentCount} description="Canonical identities with a Phase 4 simulated strategy-assignment projection. No runtime or dispatch is connected." />
      <AgentWorkforceNav />
      <aside className="agent-registry-banner glass" role="note"><DatabaseZap aria-hidden="true" size={16} /><div><strong>Canonical registry preserved: 28 agents</strong><p>Identity and roles come from the existing registry. Task, status, progress, dependency, output, review, error, and cost fields are a simulated presentation adapter.</p></div><DataSourceIndicator details provenance={data.provenance} /></aside>
      <AgentWorkforceTable workforce={data.workforce} />
      <details
        className="preserved-agent-operations"
        onToggle={(event) =>
          setPreservedOperationsOpen(event.currentTarget.open)
        }
      >
        <summary>Open preserved registry operations and telemetry simulation</summary>
        <div>
          <p>
            Phase 4 extends rather than removes the existing canonical registry
            filters, summary, activity stream, cards, and development telemetry.
          </p>
          {preservedOperationsOpen ? <AgentRegistryOperations /> : null}
        </div>
      </details>
      <CapabilityBoundary detail="Agent assignment is not dispatch. Status is not runtime telemetry. Output is not execution output. Cost is an allocated simulation estimate. No agent process is running." reality="simulation" state="simulated" title="Workforce execution boundary" />
    </main>
  );
}
