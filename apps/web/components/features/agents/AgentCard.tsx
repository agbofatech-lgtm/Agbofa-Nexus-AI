import { Activity, Clock3, Gauge, ListChecks, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { AgentStatusBadge } from "@/components/features/agents/AgentStatusBadge";
import { Badge } from "@/components/ui";
import type { Agent } from "@/types/agents";

interface AgentCardProps {
  agent: Agent;
}

function healthBand(health: number): string {
  if (health >= 95) return "healthy";
  if (health >= 80) return "warning";
  return "critical";
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link
      aria-label={`Open ${agent.id} ${agent.name}`}
      className={`agent-card agent-card--${agent.status} glass-card`}
      href={`/agents/${agent.id}`}
    >
      <div className="agent-card__heading">
        <span>{agent.id}</span>
        <AgentStatusBadge status={agent.status} />
      </div>
      <div className="agent-card__identity">
        <strong>{agent.name}</strong>
        <span>{agent.category}</span>
      </div>
      <p>{agent.description}</p>
      <div className="agent-card__health">
        <span>
          <Gauge size={13} /> Health <strong>{agent.health}%</strong>
        </span>
        <i data-band={healthBand(agent.health)}>
          <b style={{ width: `${agent.health}%` }} />
        </i>
      </div>
      <dl className="agent-card__metrics">
        <div>
          <dt>
            <ListChecks size={12} /> Queue
          </dt>
          <dd>{agent.queue}</dd>
        </div>
        <div>
          <dt>
            <Activity size={12} /> Throughput
          </dt>
          <dd>{agent.throughput.toLocaleString()}/s</dd>
        </div>
        <div>
          <dt>
            <Clock3 size={12} /> Latency
          </dt>
          <dd>{agent.latency}ms</dd>
        </div>
        <div>
          <dt>
            <ShieldCheck size={12} /> Success
          </dt>
          <dd>{agent.successRate}%</dd>
        </div>
      </dl>
      <div className="agent-card__task">
        {agent.currentTask ? (
          <>
            <span>Current task · development runtime</span>
            <strong>{agent.currentTask.title}</strong>
            <i>
              <b style={{ width: `${agent.currentTask.progress}%` }} />
            </i>
          </>
        ) : (
          <span>No active task · {agent.status}</span>
        )}
      </div>
      {agent.lastExecution ? (
        <div className="agent-card__latest-output">
          <span>Latest output</span>
          <strong>{agent.lastExecution.summary}</strong>
        </div>
      ) : null}
      <div className="agent-card__footer">
        <Badge variant="category" category="AI">
          {agent.category}
        </Badge>
        <span>
          Implementation: {agent.implementationStatus.replace("_", " ")}
        </span>
      </div>
    </Link>
  );
}
