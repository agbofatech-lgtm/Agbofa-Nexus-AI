import { AgentSkeleton } from "@/components/features/agents/AgentSkeleton";

export default function AgentDetailLoading() {
  return (
    <div className="agents-page">
      <AgentSkeleton detail />
    </div>
  );
}
