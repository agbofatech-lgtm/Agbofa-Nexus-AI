"use client";

import { AgentEmptyState } from "@/components/features/agents/AgentEmptyState";
import { AgentErrorState } from "@/components/features/agents/AgentErrorState";
import { AgentFilterDrawer } from "@/components/features/agents/AgentFilterDrawer";
import { AgentFilters } from "@/components/features/agents/AgentFilters";
import { AgentGrid } from "@/components/features/agents/AgentGrid";
import { AgentHeader } from "@/components/features/agents/AgentHeader";
import { AgentSkeleton } from "@/components/features/agents/AgentSkeleton";
import { AgentSummaryCards } from "@/components/features/agents/AgentSummaryCards";
import { AgentWorkforceNav } from "@/components/features/agents/AgentWorkforceNav";
import { useAgents } from "@/hooks/useAgents";
import { useAgentsStore } from "@/stores/agents-store";
import type { AgentCategory } from "@/types/agents";

interface AgentCategoryViewProps {
  categories: readonly AgentCategory[];
  title: string;
  description: string;
  discrepancyNote: string;
}

export function AgentCategoryView({
  categories,
  title,
  description,
  discrepancyNote,
}: AgentCategoryViewProps) {
  const agents = useAgents(categories);
  const resetFilters = useAgentsStore((state) => state.resetFilters);

  return (
    <div className="agents-page">
      <AgentHeader
        count={agents.summary.total}
        description={description}
        title={title}
      />
      <AgentWorkforceNav />
      <div className="agent-discrepancy-note" role="note">
        {discrepancyNote}
      </div>
      <AgentSummaryCards loading={agents.loading} summary={agents.summary} />
      <AgentFilters categoryLocked />
      <AgentFilterDrawer categoryLocked />
      {agents.loading ? <AgentSkeleton count={6} /> : null}
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
