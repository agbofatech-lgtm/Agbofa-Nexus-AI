"use client";
import { CircleDollarSign, Gauge, Hash, WalletCards } from "lucide-react";
import { AgentCostBreakdown } from "@/components/features/ai-cost/AgentCostBreakdown";
import { AICostEmptyState } from "@/components/features/ai-cost/AICostEmptyState";
import { AICostErrorState } from "@/components/features/ai-cost/AICostErrorState";
import { AICostHeader } from "@/components/features/ai-cost/AICostHeader";
import { AICostSkeleton } from "@/components/features/ai-cost/AICostSkeleton";
import { BudgetAlerts } from "@/components/features/ai-cost/BudgetAlerts";
import { CostOptimizationRecommendations } from "@/components/features/ai-cost/CostOptimizationRecommendations";
import { FreeTierMonitor } from "@/components/features/ai-cost/FreeTierMonitor";
import { ProviderCostCard } from "@/components/features/ai-cost/ProviderCostCard";
import { UsageForecast } from "@/components/features/ai-cost/UsageForecast";
import { BusinessMetric } from "@/components/features/business/BusinessMetric";
import { DataStateBanner } from "@/components/features/business/DataStateBanner";
import { useAgents } from "@/hooks/useAgents";
import { useBusinessModule } from "@/hooks/useBusinessModule";
export function AICostDashboard() {
  const { value, retry } = useBusinessModule("aiCost");
  const agents = useAgents();
  if (value.state === "loading")
    return (
      <>
        <AICostHeader />
        <AICostSkeleton />
      </>
    );
  if (value.state === "error")
    return (
      <>
        <AICostHeader />
        <AICostErrorState message={value.error ?? ""} onRetry={retry} />
      </>
    );
  if (!value.data)
    return (
      <>
        <AICostHeader />
        <AICostEmptyState />
      </>
    );
  const d = value.data;
  const icons = [CircleDollarSign, WalletCards, Hash, Gauge] as const;
  return (
    <main className="business-page">
      <AICostHeader />
      <DataStateBanner value={value} />
      <section className="business-metric-grid">
        {d.metrics.map((m, i) => (
          <BusinessMetric
            authority={m.authority}
            detail="Demo fixture classification"
            icon={icons[i] ?? Gauge}
            key={m.id}
            label={m.label}
            tone={i === 3 ? "green" : i === 2 ? "blue" : "gold"}
            value={
              m.value === null
                ? "—"
                : `${m.unit === "$" ? "$" : ""}${m.value.toLocaleString()}`
            }
          />
        ))}
      </section>
      <section className="provider-cost-grid">
        {d.providers.map((p) => (
          <ProviderCostCard key={p.id} provider={p} />
        ))}
      </section>
      <AgentCostBreakdown agents={agents.agents} />
      <div className="ai-cost-grid">
        <FreeTierMonitor providers={d.providers} />
        <BudgetAlerts initial={d.budget} />
      </div>
      <UsageForecast data={d.forecast} />
      <CostOptimizationRecommendations items={d.recommendations} />
    </main>
  );
}
