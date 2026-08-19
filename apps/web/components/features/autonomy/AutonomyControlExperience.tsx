"use client";

import { AIControlWorkspaceNav } from "@/components/features/ai-control/AIControlWorkspaceNav";
import { AutonomyControlCenter } from "@/components/features/autonomy/AutonomyControlCenter";
import { DemoDataBanner } from "@/components/features/intelligence/DemoDataBanner";
import { IntelligenceHeader } from "@/components/features/intelligence/IntelligenceHeader";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { usePhase5Experience } from "@/hooks/usePhase5Experience";
import { useStrategyDirector } from "@/hooks/useStrategyDirector";

export function AutonomyControlExperience() {
  const phase5 = usePhase5Experience();
  const strategy = useStrategyDirector();
  const flags = useFeatureFlags();
  const header = (
    <>
      <IntelligenceHeader
        eyebrow="Phase 5 · Policy Simulation"
        subtitle="Explore how Nexus could operate under domain policies while keeping enforcement, execution, persistence, spending, and provider effects unavailable."
        title="Autonomy Control Center"
      />
      <DemoDataBanner
        partial
        message="SIMULATED AUTONOMY CONFIGURATION. Frontend policy state does not enable or enforce autonomous execution."
      />
      <AIControlWorkspaceNav />
    </>
  );
  if (!flags.isEnabled("autonomy"))
    return <div className="intelligence-page phase5-page">{header}<CapabilityBoundary detail="The autonomy experience flag is disabled. No hidden autonomous system exists." title="Autonomy simulation unavailable" /></div>;
  if (phase5.loading || strategy.loading)
    return <div className="intelligence-page phase5-page">{header}<WorkspaceState state="loading" /></div>;
  if (phase5.error || strategy.error || !phase5.data || !strategy.data)
    return <div className="intelligence-page phase5-page">{header}<WorkspaceState message={phase5.error ?? strategy.error ?? "Autonomy simulation unavailable."} onRetry={() => { phase5.retry(); strategy.retry(); }} state="error" /></div>;
  return (
    <main className="intelligence-page phase5-page">
      {header}
      <AutonomyControlCenter phase5={phase5.data} strategy={strategy.data} />
      <CapabilityBoundary
        detail="Autonomy setting is not enforcement. Approval policy is not backend policy. A run is not a real run. The kill switch cannot interrupt services."
        dependency="Authorized policy, orchestration, audit, budget, and emergency-control services"
        reality="simulation"
        state="simulated"
        title="Autonomy execution unavailable"
      />
    </main>
  );
}
