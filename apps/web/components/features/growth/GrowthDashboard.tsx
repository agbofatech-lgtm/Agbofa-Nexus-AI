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
import { GrowthOverview } from "@/components/features/growth/GrowthOverview";
import { GrowthStats } from "@/components/features/growth/GrowthStats";
import { GrowthWorkspaceNav } from "@/components/features/growth/GrowthWorkspaceNav";
import { ReferralSystem } from "@/components/features/growth/ReferralSystem";
import { WorkflowRail } from "@/components/shared/operations/WorkflowRail";
import { WorkspaceState } from "@/components/shared/states";
import { useBusinessModule } from "@/hooks/useBusinessModule";
import { useGrowthIntelligence } from "@/hooks/useGrowthIntelligence";
export function GrowthDashboard() {
  const { value, retry } = useBusinessModule("growth");
  const intelligence = useGrowthIntelligence();
  if (value.state === "loading")
    return (
      <>
        <GrowthHeader />
        <GrowthWorkspaceNav />
        <BusinessState state="loading" />
      </>
    );
  if (value.state === "error")
    return (
      <>
        <GrowthHeader />
        <GrowthWorkspaceNav />
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
        <GrowthWorkspaceNav />
        <BusinessState state="empty" />
      </>
    );
  const d = value.data;
  return (
    <div className="business-page">
      <GrowthHeader />
      <GrowthWorkspaceNav />
      {intelligence.loading ? (
        <WorkspaceState state="loading" />
      ) : intelligence.error || !intelligence.data ? (
        <WorkspaceState
          message={intelligence.error ?? "Growth Intelligence unavailable."}
          onRetry={intelligence.retry}
          state="error"
        />
      ) : (
        <GrowthOverview data={intelligence.data} />
      )}
      <div className="growth-operational-divider">
        <span>Existing Growth operations</span>
        <h2>Audience, campaigns, retention, and experiments</h2>
      </div>
      <DataStateBanner value={value} />
      <WorkflowRail
        description="Editorial value to audience, retention, conversion, and revenue."
        stages={d.operatingLoop}
        title="Growth value chain"
      />
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
