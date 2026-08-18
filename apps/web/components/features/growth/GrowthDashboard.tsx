"use client";
import { DataStateBanner } from "@/components/features/business/DataStateBanner";
import { BusinessState } from "@/components/features/business/BusinessState";
import { AudienceFunnel } from "@/components/features/growth/AudienceFunnel";
import { CampaignManager } from "@/components/features/growth/CampaignManager";
import { ChannelPerformance } from "@/components/features/growth/ChannelPerformance";
import { ConversionRetention } from "@/components/features/growth/ConversionRetention";
import { GrowthExperiments } from "@/components/features/growth/GrowthExperiments";
import { GrowthFlywheel } from "@/components/features/growth/GrowthFlywheel";
import { GrowthHeader } from "@/components/features/growth/GrowthHeader";
import { GrowthRecommendations } from "@/components/features/growth/GrowthRecommendations";
import { GrowthStats } from "@/components/features/growth/GrowthStats";
import { ReferralSystem } from "@/components/features/growth/ReferralSystem";
import { useBusinessModule } from "@/hooks/useBusinessModule";
export function GrowthDashboard() {
  const { value, retry } = useBusinessModule("growth");
  if (value.state === "loading")
    return (
      <>
        <GrowthHeader />
        <BusinessState state="loading" />
      </>
    );
  if (value.state === "error")
    return (
      <>
        <GrowthHeader />
        <BusinessState
          message={value.error ?? ""}
          onRetry={retry}
          state="error"
        />
      </>
    );
  if (!value.data)
    return (
      <>
        <GrowthHeader />
        <BusinessState state="empty" />
      </>
    );
  const d = value.data;
  return (
    <div className="business-page">
      <GrowthHeader />
      <DataStateBanner value={value} />
      <GrowthStats metrics={d.metrics} />
      <GrowthFlywheel stages={d.flywheel} />
      <div className="growth-primary">
        <AudienceFunnel funnel={d.funnel} />
        <ChannelPerformance channels={d.channelComparison} />
      </div>
      <div className="growth-primary">
        <ConversionRetention channels={d.channelComparison} />
        <GrowthRecommendations items={d.recommendations} />
      </div>
      <div className="growth-primary">
        <CampaignManager campaigns={d.campaigns} />
        <ReferralSystem />
      </div>
      <GrowthExperiments experiments={d.experiments} />
    </div>
  );
}
