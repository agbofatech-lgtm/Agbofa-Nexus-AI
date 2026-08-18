import {
  Activity,
  Clock3,
  HeartPulse,
  ListChecks,
  ShieldCheck,
} from "lucide-react";

import type { Agent } from "@/types/agents";

interface AgentMetricCardsProps {
  agent: Agent;
}

const metrics = [
  { key: "health", label: "Health", icon: HeartPulse, suffix: "%" },
  { key: "queue", label: "Queue", icon: ListChecks, suffix: "" },
  { key: "throughput", label: "Throughput", icon: Activity, suffix: "/s" },
  { key: "latency", label: "Latency", icon: Clock3, suffix: "ms" },
  { key: "successRate", label: "Success rate", icon: ShieldCheck, suffix: "%" },
] as const;

export function AgentMetricCards({ agent }: AgentMetricCardsProps) {
  return (
    <section className="agent-metric-grid" aria-label="Agent metrics">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const value = agent[metric.key];
        return (
          <div key={metric.key} className="agent-metric glass-card">
            <span>
              <Icon size={17} />
            </span>
            <div>
              <strong>
                {typeof value === "number" ? value.toLocaleString() : value}
                {metric.suffix}
              </strong>
              <small>{metric.label}</small>
            </div>
            <b>simulated</b>
          </div>
        );
      })}
    </section>
  );
}
