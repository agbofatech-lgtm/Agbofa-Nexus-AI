"use client";

import dynamic from "next/dynamic";

import { IntelligenceState } from "@/components/features/intelligence/IntelligenceState";
import { EngagementCard } from "@/components/features/predictive/EngagementCard";
import { OptimizationCard } from "@/components/features/predictive/OptimizationCard";
import { PredictiveHeader } from "@/components/features/predictive/PredictiveHeader";
import { PredictiveSkeleton } from "@/components/features/predictive/PredictiveSkeleton";
import { PredictiveStats } from "@/components/features/predictive/PredictiveStats";
import { TrendAnalysis } from "@/components/features/predictive/TrendAnalysis";
import { ViralityCard } from "@/components/features/predictive/ViralityCard";
import { Skeleton } from "@/components/ui";
import { usePredictiveIntelligence } from "@/hooks/useIntelligence";

const PredictiveChart = dynamic(
  () =>
    import("@/components/features/predictive/PredictiveChart").then(
      (module) => module.PredictiveChart,
    ),
  { ssr: false, loading: () => <Skeleton height={340} rounded="lg" /> },
);

export function PredictiveDashboard() {
  const predictive = usePredictiveIntelligence();
  if (predictive.loading)
    return (
      <>
        <PredictiveHeader />
        <PredictiveSkeleton />
      </>
    );
  if (predictive.error)
    return (
      <>
        <PredictiveHeader />
        <IntelligenceState
          message={predictive.error}
          onRetry={predictive.retry}
          state="error"
        />
      </>
    );
  if (!predictive.data)
    return (
      <>
        <PredictiveHeader />
        <IntelligenceState state="empty" />
      </>
    );
  return (
    <main className="intelligence-page">
      <PredictiveHeader />
      <PredictiveStats
        agentSummary={predictive.agentSummary}
        data={predictive.data}
      />
      <div className="predictive-primary-grid">
        <ViralityCard prediction={predictive.data.virality} />
        <EngagementCard prediction={predictive.data.engagement} />
      </div>
      <PredictiveChart series={predictive.data.series} />
      <div className="predictive-secondary-grid">
        <TrendAnalysis trends={predictive.data.trends} />
        <OptimizationCard recommendations={predictive.data.recommendations} />
      </div>
    </main>
  );
}
