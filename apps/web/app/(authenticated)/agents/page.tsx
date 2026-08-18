"use client";
import { DatabaseZap } from "lucide-react";
import { AgentEmptyState } from "@/components/features/agents/AgentEmptyState";
import { AgentErrorState } from "@/components/features/agents/AgentErrorState";
import { AgentFilterDrawer } from "@/components/features/agents/AgentFilterDrawer";
import { AgentFilters } from "@/components/features/agents/AgentFilters";
import { AgentGrid } from "@/components/features/agents/AgentGrid";
import { AgentHeader } from "@/components/features/agents/AgentHeader";
import { AgentSkeleton } from "@/components/features/agents/AgentSkeleton";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import { ActivityTimeline } from "@/components/shared/operations/ActivityTimeline";
import { OperationsSummary } from "@/components/shared/operations/OperationsSummary";
import { useAgents } from "@/hooks/useAgents";
import { useAgentsStore } from "@/stores/agents-store";
import { createDataProvenance } from "@/types/data-state";
import type { ActivityEvent, OperationalMetric } from "@/types/operations";
const provenance = createDataProvenance(
  "mock",
  "Canonical registry + development runtime adapter",
  "Registry identity is repository-backed. Runtime state and events are deterministic development data.",
);
export default function AgentsPage() {
  const a = useAgents();
  const reset = useAgentsStore((s) => s.resetFilters);
  const metrics: OperationalMetric[] = [
    {
      id: "running",
      label: "Running state",
      value: String(a.summary.running),
      detail: "Development runtime",
      tone: "blue",
    },
    {
      id: "queued",
      label: "Queued agents",
      value: String(a.agents.filter((x) => x.status === "queued").length),
      detail: "Modeled work",
      tone: "warning",
    },
    {
      id: "backlog",
      label: "Task backlog",
      value: String(a.agents.reduce((n, x) => n + x.queue, 0)),
      detail: "Across registry",
      tone: "purple",
    },
    {
      id: "attention",
      label: "Needs attention",
      value: String(a.summary.attention),
      detail: "Degraded or failed",
      tone: a.summary.attention ? "error" : "green",
    },
  ];
  const events = a.agents
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
      actor: `${agent.id} · ${agent.category}`,
    }));
  return (
    <div className="agents-page">
      <AgentHeader count={a.summary.total} />
      <div className="agent-registry-banner glass" role="note">
        <DatabaseZap size={16} />
        <div>
          <strong>Canonical registry: 28 agents</strong>
          <p>
            Identity is repository-backed. Runtime signals remain development
            data until orchestration is connected.
          </p>
        </div>
        <DataSourceIndicator details provenance={provenance} />
      </div>
      <OperationsSummary
        eyebrow="Agent workforce"
        metrics={metrics}
        provenance={provenance}
        title="Operational posture"
      />
      {events.length ? (
        <div className="agent-activity-panel">
          <div className="agent-panel-heading">
            <div>
              <span className="section-kicker">Activity stream</span>
              <h2>Latest workforce events</h2>
            </div>
          </div>
          <ActivityTimeline events={events} title="Agent activity stream" />
        </div>
      ) : null}
      <AgentFilters />
      <AgentFilterDrawer />
      <div className="agent-results-meta">
        <span>{a.filteredAgents.length} agents shown</span>
        <b>Development runtime · not live execution</b>
      </div>
      {a.loading ? <AgentSkeleton /> : null}
      {!a.loading && a.error ? (
        <AgentErrorState message={a.error} onRetry={a.retry} />
      ) : null}
      {!a.loading && !a.error && !a.filteredAgents.length ? (
        <AgentEmptyState onReset={reset} />
      ) : null}
      {!a.loading && !a.error && a.filteredAgents.length ? (
        <AgentGrid agents={a.filteredAgents} />
      ) : null}
    </div>
  );
}
