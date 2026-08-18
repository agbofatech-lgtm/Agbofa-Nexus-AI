"use client";

import { useParams } from "next/navigation";

import { AgentDependencies } from "@/components/features/agents/AgentDependencies";
import { AgentDetailHeader } from "@/components/features/agents/AgentDetailHeader";
import { AgentExecutionTimeline } from "@/components/features/agents/AgentExecutionTimeline";
import { AgentMetricCards } from "@/components/features/agents/AgentMetricCards";
import { AgentNotFound } from "@/components/features/agents/AgentNotFound";
import { AgentSkeleton } from "@/components/features/agents/AgentSkeleton";
import { AgentTaskPanel } from "@/components/features/agents/AgentTaskPanel";
import { AgentTelemetry } from "@/components/features/agents/AgentTelemetry";
import { useAgent } from "@/hooks/useAgents";

export default function AgentDetailPage() {
  const params = useParams<{ agentId: string | string[] }>();
  const rawId = params.agentId;
  const agentId = Array.isArray(rawId) ? (rawId[0] ?? "") : rawId;
  const { agent, loading, error, notFound, retry } = useAgent(agentId);

  if (loading) return <AgentSkeleton detail />;
  if (notFound || (!agent && !error)) return <AgentNotFound />;
  if (error) return <AgentNotFound error={error} onRetry={retry} />;
  if (!agent) return <AgentNotFound />;

  return (
    <div className="agent-detail-page">
      <AgentDetailHeader agent={agent} />
      <AgentMetricCards agent={agent} />
      <AgentTelemetry telemetry={agent.telemetry} />
      <div className="agent-detail-grid">
        <AgentTaskPanel
          agentStatus={agent.status}
          task={agent.currentTask}
          telemetryEnd={agent.telemetry.throughput.at(-1)?.at}
        />
        <AgentDependencies agent={agent} dependencies={agent.dependencies} />
      </div>
      <AgentExecutionTimeline executions={agent.executions} />
    </div>
  );
}
