import { ArrowDown, Boxes, DatabaseZap } from "lucide-react";
import Link from "next/link";

import type { Agent, AgentDependencies as Dependencies } from "@/types/agents";

interface AgentDependenciesProps {
  agent: Agent;
  dependencies: Dependencies;
}

function AgentNode({ id, active = false }: { id: string; active?: boolean }) {
  return active ? (
    <div className="agent-dependency-node agent-dependency-node--active">
      <strong>{id}</strong>
      <span>Selected agent</span>
    </div>
  ) : (
    <Link className="agent-dependency-node" href={`/agents/${id}`}>
      <strong>{id}</strong>
      <span>Simulated relationship</span>
    </Link>
  );
}

export function AgentDependencies({
  agent,
  dependencies,
}: AgentDependenciesProps) {
  return (
    <section
      className="agent-dependencies glass"
      aria-labelledby="agent-dependencies-title"
    >
      <div className="agent-panel-heading">
        <div>
          <span className="section-kicker">
            <Boxes size={12} /> Relationships
          </span>
          <h2 id="agent-dependencies-title">Dependencies</h2>
        </div>
        <span>Simulated topology</span>
      </div>
      <div className="agent-dependency-warning">
        <DatabaseZap size={14} /> Canonical input/output dependencies are
        pending detailed extraction. The links below only demonstrate the future
        interface.
      </div>
      <div className="agent-dependency-flow">
        {dependencies.input.length ? (
          dependencies.input.map((id) => (
            <div key={id} className="agent-dependency-step">
              <AgentNode id={id} />
              <ArrowDown size={15} />
            </div>
          ))
        ) : (
          <span className="agent-dependency-empty">No simulated input</span>
        )}
        <div className="agent-dependency-step">
          <AgentNode active id={agent.id} />
          {dependencies.output.length ? <ArrowDown size={15} /> : null}
        </div>
        {dependencies.output.length ? (
          dependencies.output.map((id) => <AgentNode key={id} id={id} />)
        ) : (
          <span className="agent-dependency-empty">No simulated output</span>
        )}
      </div>
    </section>
  );
}
