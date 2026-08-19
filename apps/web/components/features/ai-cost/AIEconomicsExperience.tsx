"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AICostHeader } from "@/components/features/ai-cost/AICostHeader";
import { AIEconomicsDashboard } from "@/components/features/ai-cost/AIEconomicsDashboard";
import { DataStateBanner } from "@/components/features/business/DataStateBanner";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { usePhase5Experience } from "@/hooks/usePhase5Experience";
import { useStrategyDirector } from "@/hooks/useStrategyDirector";

const PreservedAICostDashboard = dynamic(() =>
  import("@/components/features/ai-cost/AICostDashboard").then(
    (module) => module.AICostDashboard,
  ),
);

export function AIEconomicsExperience() {
  const phase5 = usePhase5Experience();
  const strategy = useStrategyDirector();
  const [legacyOpen, setLegacyOpen] = useState(false);
  if (phase5.loading || strategy.loading)
    return <><AICostHeader /><WorkspaceState state="loading" /></>;
  if (phase5.error || strategy.error || !phase5.data || !strategy.data)
    return <><AICostHeader /><WorkspaceState message={phase5.error ?? strategy.error ?? "AI Economics unavailable."} onRetry={() => { phase5.retry(); strategy.retry(); }} state="error" /></>;
  return (
    <main className="business-page phase5-page">
      <AICostHeader />
      {phase5.value ? <DataStateBanner value={phase5.value} /> : null}
      <AIEconomicsDashboard data={phase5.data} strategies={strategy.data.plans} />
      <details className="preserved-ai-cost" onToggle={(event) => setLegacyOpen(event.currentTarget.open)}>
        <summary>Open preserved AI Cost development dashboard</summary>
        <div><p>The existing provider cards, agent allocation, thresholds, forecast, and recommendation experience remains available. Its values are development fixtures—not authoritative billing.</p>{legacyOpen ? <PreservedAICostDashboard embedded /> : null}</div>
      </details>
      <CapabilityBoundary detail="Estimated token use and model selection do not call providers. Budget changes do not spend money. Actual cost, actual revenue, and verified ROI remain unavailable." dependency="Authoritative provider usage, billing, attribution, and revenue contracts" reality="simulation" state="simulated" title="AI economics is not billing" />
    </main>
  );
}
