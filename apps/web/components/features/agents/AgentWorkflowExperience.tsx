"use client";

import { AgentHeader } from "@/components/features/agents/AgentHeader";
import { AgentWorkforceNav } from "@/components/features/agents/AgentWorkforceNav";
import { AgentWorkflowMap } from "@/components/features/agents/AgentWorkflowMap";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useStrategyDirector } from "@/hooks/useStrategyDirector";

export function AgentWorkflowExperience() {
  const workspace = useStrategyDirector();
  const flags = useFeatureFlags();
  if (!flags.isEnabled("agents"))
    return <CapabilityBoundary detail="The canonical agent workforce experience flag is disabled." title="Agent Workflow unavailable" />;
  if (workspace.loading)
    return <div className="agents-page"><AgentHeader count={28} title="Agent Workflow" /><AgentWorkforceNav /><WorkspaceState state="loading" /></div>;
  if (workspace.error || !workspace.data)
    return <div className="agents-page"><AgentHeader count={28} title="Agent Workflow" /><AgentWorkforceNav /><WorkspaceState message={workspace.error ?? "Agent Workflow unavailable."} onRetry={workspace.retry} state="error" /></div>;
  return (
    <main className="agents-page phase4-workforce-page">
      <AgentHeader count={workspace.data.canonicalAgentCount} description="Nine-stage simulated strategy workflow with canonical participants, dependencies, outputs, and human review gates." title="Agent Workflow" />
      <AgentWorkforceNav />
      <AgentWorkflowMap data={workspace.data} />
      <CapabilityBoundary detail="This graph is not an orchestration engine. It cannot communicate with agents, schedule dependencies, dispatch tasks, approve outputs, distribute content, or optimize systems." reality="simulation" state="simulated" title="Workflow simulation boundary" />
    </main>
  );
}
