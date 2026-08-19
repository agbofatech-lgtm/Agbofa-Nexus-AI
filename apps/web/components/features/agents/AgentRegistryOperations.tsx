"use client";

import { AgentEmptyState } from "@/components/features/agents/AgentEmptyState";
import { AgentErrorState } from "@/components/features/agents/AgentErrorState";
import { AgentFilterDrawer } from "@/components/features/agents/AgentFilterDrawer";
import { AgentFilters } from "@/components/features/agents/AgentFilters";
import { AgentGrid } from "@/components/features/agents/AgentGrid";
import { AgentSkeleton } from "@/components/features/agents/AgentSkeleton";
import { ActivityTimeline } from "@/components/shared/operations/ActivityTimeline";
import { OperationsSummary } from "@/components/shared/operations/OperationsSummary";
import { useAgents } from "@/hooks/useAgents";
import { useAgentsStore } from "@/stores/agents-store";
import { createDataProvenance } from "@/types/data-state";
import type { ActivityEvent, OperationalMetric } from "@/types/operations";

const provenance = createDataProvenance(
  "mock",
  "Canonical registry + preserved development runtime adapter",
  "Registry identity is repository-backed. Runtime state and events are deterministic development data, not Phase 4 execution.",
);

export function AgentRegistryOperations() {
  const agents = useAgents();
  const reset = useAgentsStore((state) => state.resetFilters);
  const metrics: OperationalMetric[] = [
    {
      id: "running",
      label: "Running state",
      value: String(agents.summary.running),
      detail: "Preserved development runtime",
      tone: "blue",
    },
    {
      id: "queued",
      label: "Queued agents",
      value: String(
        agents.agents.filter((agent) => agent.status === "queued").length,
      ),
      detail: "Modeled work",
      tone: "warning",
    },
    {
      id: "backlog",
      label: "Task backlog",
      value: String(
        agents.agents.reduce((total, agent) => total + agent.queue, 0),
      ),
      detail: "Across registry",
      tone: "purple",
    },
    {
      id: "attention",
      label: "Needs attention",
      value: String(agents.summary.attention),
      detail: "Degraded or failed",
      tone: agents.summary.attention ? "error" : "green",
    },
  ];
  const events = agents.agents
    .flatMap((agent) =>
      agent.lastExecution ? [{ agent, execution: agent.lastExecution }] : [],
    )
    .slice(0, 5)
    .map<ActivityEvent>(({ agent, execution }) => ({
      id: `${agent.id}-${execution.id}`,
      time: new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(execution.startedAt),
      title: `${agent.name} ${execution.status === "success" ? "completed a task" : "reported an exception"}`,
      detail: execution.summary,
      status:
        execution.status === "success"
          ? "completed"
          : execution.status === "warning"
            ? "degraded"
            : "failed",
      actor: `${agent.id} · ${agent.category} · SIMULATED`,
    }));
  return (
    <div className="agent-registry-operations">
      <OperationsSummary
        eyebrow="Preserved agent registry operations"
        metrics={metrics}
        provenance={provenance}
        title="Development telemetry posture"
      />
      {events.length ? (
        <div className="agent-activity-panel">
          <div className="agent-panel-heading">
            <div>
              <span className="section-kicker">Preserved activity stream</span>
              <h2>Latest simulated registry events</h2>
            </div>
          </div>
          <ActivityTimeline
            events={events}
            title="Preserved simulated agent activity stream"
          />
        </div>
      ) : null}
      <AgentFilters />
      <AgentFilterDrawer />
      <div className="agent-results-meta">
        <span>{agents.filteredAgents.length} agents shown</span>
        <b>Development runtime · not live execution</b>
      </div>
      {agents.loading ? <AgentSkeleton /> : null}
      {!agents.loading && agents.error ? (
        <AgentErrorState message={agents.error} onRetry={agents.retry} />
      ) : null}
      {!agents.loading && !agents.error && !agents.filteredAgents.length ? (
        <AgentEmptyState onReset={reset} />
      ) : null}
      {!agents.loading && !agents.error && agents.filteredAgents.length ? (
        <AgentGrid agents={agents.filteredAgents} />
      ) : null}
    </div>
  );
}
