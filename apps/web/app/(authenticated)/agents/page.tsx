"use client";

import { DatabaseZap } from "lucide-react";

import { AgentEmptyState } from "@/components/features/agents/AgentEmptyState";
import { AgentErrorState } from "@/components/features/agents/AgentErrorState";
import { AgentFilterDrawer } from "@/components/features/agents/AgentFilterDrawer";
import { AgentFilters } from "@/components/features/agents/AgentFilters";
import { AgentGrid } from "@/components/features/agents/AgentGrid";
import { AgentHeader } from "@/components/features/agents/AgentHeader";
import { AgentSkeleton } from "@/components/features/agents/AgentSkeleton";
import { AgentSummaryCards } from "@/components/features/agents/AgentSummaryCards";
import { useAgents } from "@/hooks/useAgents";
import { useAgentsStore } from "@/stores/agents-store";

export default function AgentsPage() {
  const agents = useAgents();
  const resetFilters = useAgentsStore((state) => state.resetFilters);

  return (
    <div className="agents-page">
      <AgentHeader count={agents.summary.total} />
      <div className="agent-registry-banner glass" role="note">
        <DatabaseZap size={16} />
        <div>
          <strong>Canonical registry: 28 agents</strong>
          <p>
            docs/indexes/json/agents.json defines AGT-001 through AGT-028.
            AGT-029–032 and the proposed IMP-017 subgroup assignments are not
            present in this checkout.
          </p>
        </div>
      </div>
      <AgentSummaryCards loading={agents.loading} summary={agents.summary} />
      <AgentFilters />
      <AgentFilterDrawer />
      <div className="agent-results-meta">
        <span>{agents.filteredAgents.length} agents shown</span>
        <b>DEMO TELEMETRY · NOT LIVE</b>
      </div>
      {agents.loading ? <AgentSkeleton /> : null}
      {!agents.loading && agents.error ? (
        <AgentErrorState message={agents.error} onRetry={agents.retry} />
      ) : null}
      {!agents.loading && !agents.error && !agents.filteredAgents.length ? (
        <AgentEmptyState onReset={resetFilters} />
      ) : null}
      {!agents.loading && !agents.error && agents.filteredAgents.length ? (
        <AgentGrid agents={agents.filteredAgents} />
      ) : null}
    </div>
  );
}
