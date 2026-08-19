import { Coins, Hash, MessagesSquare, ShieldCheck } from "lucide-react";

import { IntelligenceMetricCard } from "@/components/features/intelligence/IntelligenceMetricCard";
import type { AgentSummary } from "@/types/agents";
import type { AIControlData } from "@/types/ai-control";

export function UsageMetrics({
  data,
  agents,
}: {
  data: AIControlData;
  agents: AgentSummary;
}) {
  return (
    <section className="intelligence-metric-grid">
      <IntelligenceMetricCard
        detail="Example request volume"
        icon={MessagesSquare}
        label="Requests"
        value={data.totalRequests.toLocaleString()}
      />
      <IntelligenceMetricCard
        detail="Example token usage"
        icon={Hash}
        label="Tokens"
        tone="purple"
        value={`${(data.totalTokens / 1_000_000).toFixed(1)}M`}
      />
      <IntelligenceMetricCard
        detail="Estimated demo spend"
        icon={Coins}
        label="Estimated cost"
        tone="warning"
        value={`$${data.estimatedCost.toLocaleString()}`}
      />
      <IntelligenceMetricCard
        detail={`${agents.attention} simulated agents need attention`}
        icon={ShieldCheck}
        label="Workforce health"
        tone="green"
        value={`${agents.averageHealth}%`}
      />
    </section>
  );
}
