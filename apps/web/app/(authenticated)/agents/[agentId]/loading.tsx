import { AgentSkeleton } from "@/components/features/agents/AgentSkeleton";

export default function AgentDetailLoading() {
  return (
    <main className="agents-page">
      <AgentSkeleton detail />
    </main>
  );
}
