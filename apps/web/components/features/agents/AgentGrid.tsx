import { AgentCard } from "@/components/features/agents/AgentCard";
import type { Agent } from "@/types/agents";

interface AgentGridProps {
  agents: Agent[];
}

export function AgentGrid({ agents }: AgentGridProps) {
  return (
    <section aria-label="Agent workforce" className="agent-grid">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </section>
  );
}
