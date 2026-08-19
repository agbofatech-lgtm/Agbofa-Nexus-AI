import { ArrowLeft, Bot, DatabaseZap } from "lucide-react";
import Link from "next/link";

import { AgentStatusBadge } from "@/components/features/agents/AgentStatusBadge";
import { Badge } from "@/components/ui";
import type { Agent } from "@/types/agents";

interface AgentDetailHeaderProps {
  agent: Agent;
}

export function AgentDetailHeader({ agent }: AgentDetailHeaderProps) {
  return (
    <header className="agent-detail-header">
      <Link href="/agents">
        <ArrowLeft size={15} /> Back to Agents
      </Link>
      <div className="agent-detail-header__main">
        <span>
          <Bot size={25} />
        </span>
        <div>
          <small>
            {agent.id} · {agent.category}
          </small>
          <h1>{agent.name}</h1>
          <p>{agent.description}</p>
        </div>
        <AgentStatusBadge status={agent.status} />
      </div>
      <div className="agent-detail-header__notice">
        <DatabaseZap size={14} />
        <span>
          <strong>Demo telemetry</strong> Simulated runtime values; canonical
          implementation status remains{" "}
          {agent.implementationStatus.replace("_", " ")}.
        </span>
        <Badge verification="unverified" variant="verification">
          Not live
        </Badge>
      </div>
    </header>
  );
}
