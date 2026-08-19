import { Activity, AlertTriangle, Bot, HeartPulse } from "lucide-react";

import { Skeleton } from "@/components/ui";
import type { AgentSummary } from "@/types/agents";

interface AgentSummaryCardsProps {
  summary: AgentSummary;
  loading?: boolean;
}

const cards = [
  { key: "total", label: "Total agents", icon: Bot, tone: "gold" },
  { key: "running", label: "Simulated running", icon: Activity, tone: "blue" },
  {
    key: "averageHealth",
    label: "Average health",
    icon: HeartPulse,
    tone: "green",
  },
  {
    key: "attention",
    label: "Needs attention",
    icon: AlertTriangle,
    tone: "red",
  },
] as const;

export function AgentSummaryCards({
  summary,
  loading = false,
}: AgentSummaryCardsProps) {
  return (
    <section
      className="agent-summary-grid"
      aria-label="Agent workforce summary"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const value =
          card.key === "averageHealth"
            ? `${summary.averageHealth}%`
            : summary[card.key];
        return (
          <div
            key={card.key}
            className={`agent-summary-card agent-summary-card--${card.tone} glass-card`}
          >
            <span>
              <Icon size={18} />
            </span>
            <div>
              {loading ? (
                <Skeleton height={25} width={55} />
              ) : (
                <strong>{value}</strong>
              )}
              <small>{card.label}</small>
            </div>
          </div>
        );
      })}
    </section>
  );
}
