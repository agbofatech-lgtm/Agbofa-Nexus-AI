"use client";

import React from "react";
import { AgentFleetItem } from "../types";
import { AgentStatusCard } from "./agent-status-card";

export interface AgentStatusGridProps {
  agents: AgentFleetItem[];
  onSelectAgent: (agent: AgentFleetItem) => void;
  onAction: (action: "RESTART" | "DISABLE" | "QUOTA", agent: AgentFleetItem) => void;
}

export function AgentStatusGrid({
  agents,
  onSelectAgent,
  onAction,
}: AgentStatusGridProps): React.JSX.Element {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
      role="region"
      aria-label="32-Agent Fleet Status Grid"
    >
      {agents.map((agent) => (
        <AgentStatusCard
          key={agent.id}
          agent={agent}
          onSelectAgent={onSelectAgent}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

export default AgentStatusGrid;
