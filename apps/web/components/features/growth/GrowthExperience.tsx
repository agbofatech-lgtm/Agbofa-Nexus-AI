"use client";
import type { ReactNode } from "react";
import { AudienceIntelligence } from "@/components/features/growth/AudienceIntelligence";
import { CompetitorIntelligence } from "@/components/features/growth/CompetitorIntelligence";
import { ContentGapIntelligence } from "@/components/features/growth/ContentGapIntelligence";
import { GrowthPageHeader } from "@/components/features/growth/GrowthPageHeader";
import { GrowthWorkspaceNav } from "@/components/features/growth/GrowthWorkspaceNav";
import { OpportunityCenter } from "@/components/features/growth/OpportunityCenter";
import { TrendRadar } from "@/components/features/growth/TrendRadar";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useGrowthIntelligence } from "@/hooks/useGrowthIntelligence";
import type { FrontendFeatureFlag } from "@/types/feature-flags";
type View =
  "opportunities" | "trends" | "content-gap" | "audience" | "competitors";
const config: Record<
  View,
  { title: string; subtitle: string; flag: FrontendFeatureFlag }
> = {
  opportunities: {
    title: "Opportunity Center",
    subtitle:
      "Evidence-backed opportunities with impact, cost, risk, and recommended next steps.",
    flag: "opportunities",
  },
  trends: {
    title: "Trend Radar",
    subtitle:
      "Modeled momentum, relevance, lifecycle, geography, and evidence.",
    flag: "growth",
  },
  "content-gap": {
    title: "Content Gap Intelligence",
    subtitle:
      "Project existing content intelligence into explainable growth opportunities.",
    flag: "contentDNA",
  },
  audience: {
    title: "Audience Intelligence",
    subtitle:
      "Simulated segments, interests, engagement, lifecycle, and format preferences.",
    flag: "audienceIntelligence",
  },
  competitors: {
    title: "Competitor Intelligence",
    subtitle:
      "Synthetic public positioning without private competitor analytics.",
    flag: "competitorIntelligence",
  },
};
export function GrowthExperience({ view }: { view: View }) {
  const i = useGrowthIntelligence();
  const flags = useFeatureFlags();
  const c = config[view];
  const shell = (content: ReactNode, provenance = i.data?.provenance) => (
    <div className="growth-os-page">
      <GrowthPageHeader
        eyebrow="Growth Intelligence"
        provenance={provenance}
        subtitle={c.subtitle}
        title={c.title}
      />
      <GrowthWorkspaceNav />
      {content}
    </div>
  );
  if (!flags.isEnabled(c.flag))
    return shell(
      <CapabilityBoundary
        detail="The frontend flag is disabled. No hidden execution exists."
        title={`${c.title} unavailable`}
      />,
    );
  if (i.loading) return shell(<WorkspaceState state="loading" />);
  if (i.error || !i.data)
    return shell(
      <WorkspaceState
        message={i.error ?? "Growth Intelligence unavailable."}
        onRetry={i.retry}
        state="error"
      />,
    );
  const d = i.data;
  const content =
    view === "opportunities" ? (
      <OpportunityCenter data={d} />
    ) : view === "trends" ? (
      <TrendRadar data={d} />
    ) : view === "content-gap" ? (
      <ContentGapIntelligence data={d} />
    ) : view === "audience" ? (
      <AudienceIntelligence data={d} />
    ) : (
      <CompetitorIntelligence data={d} />
    );
  return shell(
    <>
      {content}
      <CapabilityBoundary
        detail="Development intelligence only. No strategy, publishing, agent, paid, or autonomous execution occurs."
        reality="simulation"
        state="simulated"
        title="Simulated intelligence boundary"
      />
    </>,
    d.provenance,
  );
}
