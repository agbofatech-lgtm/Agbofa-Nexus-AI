import { AgentSkeleton } from "@/components/features/agents/AgentSkeleton";

export default function AgentsLoading() {
  return (
    <div className="agents-page">
      <AgentSkeleton count={8} />
    </div>
  );
}
