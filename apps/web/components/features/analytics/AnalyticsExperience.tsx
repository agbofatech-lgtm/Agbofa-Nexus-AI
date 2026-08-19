"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AnalyticsDomainView } from "@/components/features/analytics/AnalyticsDomainView";
import { AttributionView } from "@/components/features/analytics/AttributionView";
import { ForecastingView } from "@/components/features/analytics/ForecastingView";
import { UnitEconomicsView } from "@/components/features/analytics/UnitEconomicsView";
import { Phase3Header } from "@/components/features/phase3/Phase3Header";
import { Phase3WorkspaceNav } from "@/components/features/phase3/Phase3WorkspaceNav";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { usePhase3Experience } from "@/hooks/usePhase3Experience";
import type { AnalyticsDomain } from "@/types/phase3-experience";

export type AnalyticsView = AnalyticsDomain;

const labels: Record<AnalyticsView, string> = {
  overview: "Overview",
  audience: "Audience",
  content: "Content",
  distribution: "Distribution",
  agents: "Agents",
  growth: "Growth",
  revenue: "Revenue",
  attribution: "Attribution",
  forecasting: "Forecasting",
  "unit-economics": "Unit Economics",
};
const descriptions: Record<AnalyticsView, string> = {
  overview: "A cross-domain decision surface that prioritizes truth state, evidence, confidence, meaning, and next action.",
  audience: "Modeled audience signals with explicit cohort assumptions and no claim of observed people or engagement.",
  content: "Content intelligence tied to canonical stories and Phase 2 Content DNA without creating another content system.",
  distribution: "Connection and delivery truth separated from structural preview readiness.",
  agents: "Canonical registry evidence separated from simulated attribution and execution claims.",
  growth: "Growth readiness interpreted from Phase 2 intelligence without claiming an outcome.",
  revenue: "Financial authority remains unavailable while billing and conversion sources are absent.",
  attribution: "Trace content through distribution, audience, conversion, and revenue while preserving unknown links.",
  forecasting: "Thirty, sixty, and ninety-day ranges with confidence, assumptions, scenario, and no guarantee.",
  "unit-economics": "CPA, CPE, LTV, ROI, and RPU remain unavailable until every required financial input has provenance.",
};
const paths: Record<AnalyticsView, string> = {
  overview: "/analytics",
  audience: "/analytics/audience",
  content: "/analytics/content",
  distribution: "/analytics/distribution",
  agents: "/analytics/agents",
  growth: "/analytics/growth",
  revenue: "/analytics/revenue",
  attribution: "/analytics/attribution",
  forecasting: "/analytics/forecasting",
  "unit-economics": "/analytics/unit-economics",
};

function AnalyticsLocalNav({ view }: { view: AnalyticsView }) {
  return (
    <nav className="phase3-local-nav phase3-local-nav--wide" aria-label="Analytics sections">
      {(Object.keys(labels) as AnalyticsView[]).map((item) => (
        <Link aria-current={item === view ? "page" : undefined} href={paths[item]} key={item}>
          {labels[item]}
        </Link>
      ))}
    </nav>
  );
}

export function AnalyticsExperience({ view }: { view: AnalyticsView }) {
  const experience = usePhase3Experience();
  const flags = useFeatureFlags();
  const shell = (content: ReactNode) => (
    <main className="phase3-page">
      <Phase3Header
        eyebrow="Phase 3 · Analytics"
        provenance={experience.data?.analytics.provenance}
        subtitle={descriptions[view]}
        title={labels[view]}
      />
      <Phase3WorkspaceNav />
      <AnalyticsLocalNav view={view} />
      {content}
    </main>
  );
  if (!flags.isEnabled("analytics"))
    return shell(<CapabilityBoundary detail="The analytics experience flag is disabled." title="Analytics unavailable" />);
  if (experience.loading) return shell(<WorkspaceState state="loading" />);
  if (experience.error || !experience.data)
    return shell(<WorkspaceState message={experience.error ?? "Analytics unavailable."} onRetry={experience.retry} state="error" />);

  const data = experience.data.analytics;
  const content =
    view === "attribution" ? (
      <AttributionView journeys={data.attribution} />
    ) : view === "forecasting" ? (
      <ForecastingView forecasts={data.forecasts} />
    ) : view === "unit-economics" ? (
      <UnitEconomicsView metrics={data.unitEconomics} />
    ) : (
      <AnalyticsDomainView allMetrics={data.metrics} domain={view} />
    );
  return shell(
    <>
      {content}
      <CapabilityBoundary
        detail="Metrics are repository observations, estimates, forecasts, simulations, or unavailable states exactly as labeled. No live analytics, attribution, conversion, revenue, or agent execution backend exists."
        reality="simulation"
        state="simulated"
        title="Analytics authority boundary"
      />
    </>,
  );
}
