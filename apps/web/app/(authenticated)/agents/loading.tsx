import { AgentSkeleton } from "@/components/features/agents/AgentSkeleton";

export default function AgentsLoading() {
  return (
    <main className="agents-page">
      <AgentSkeleton count={8} />
    </main>
  );
}
