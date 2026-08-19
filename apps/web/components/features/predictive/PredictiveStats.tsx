import { Activity, BrainCircuit, Gauge, ShieldCheck } from "lucide-react";

import { IntelligenceMetricCard } from "@/components/features/intelligence/IntelligenceMetricCard";
import type { AgentSummary } from "@/types/agents";
import type { PredictiveIntelligenceData } from "@/types/predictive";

export function PredictiveStats({
  data,
  agentSummary,
}: {
  data: PredictiveIntelligenceData;
  agentSummary: AgentSummary;
}) {
  const operationalConfidence = agentSummary.total
    ? Math.round(
        data.virality.confidence * 0.75 + agentSummary.averageHealth * 0.25,
      )
    : data.virality.confidence;
  return (
    <section className="intelligence-metric-grid">
      <IntelligenceMetricCard
        detail="Example reach likelihood"
        icon={Gauge}
        label="Virality score"
        value={`${data.virality.score}/100`}
      />
      <IntelligenceMetricCard
        detail="Example audience response"
        icon={Activity}
        label="Engagement rate"
        tone="purple"
        value={`${data.engagement.engagementRate}%`}
      />
      <IntelligenceMetricCard
        detail="Weighted with simulated agent health"
        icon={ShieldCheck}
        label="Operational confidence"
        tone="green"
        value={`${operationalConfidence}%`}
      />
      <IntelligenceMetricCard
        detail={`${agentSummary.total} canonical agents available to UI`}
        icon={BrainCircuit}
        label="Workforce context"
        tone="blue"
        value={`${agentSummary.averageHealth}%`}
      />
    </section>
  );
}
