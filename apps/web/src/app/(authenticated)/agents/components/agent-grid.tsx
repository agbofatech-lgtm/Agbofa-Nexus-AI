"use client";

import React from "react";

export interface AgentGridProps<T> {
  agents: T[];
  renderAgent: (agent: T) => React.ReactNode;
  filterBar?: React.ReactNode;
}

export function AgentGrid<T>({
  agents,
  renderAgent,
  filterBar,
}: AgentGridProps<T>): React.JSX.Element {
  return (
    <div className="space-y-4">
      {filterBar && <div>{filterBar}</div>}
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        role="region"
        aria-label="Agent Fleet Cards Grid"
      >
        {agents.map((ag) => renderAgent(ag))}
      </div>
    </div>
  );
}

export default AgentGrid;
