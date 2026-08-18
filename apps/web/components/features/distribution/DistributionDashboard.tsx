"use client";
import { DataStateBanner } from "@/components/features/business/DataStateBanner";
import { ChannelAnalytics } from "@/components/features/distribution/ChannelAnalytics";
import { ChannelGrid } from "@/components/features/distribution/ChannelGrid";
import { DistributionEmptyState } from "@/components/features/distribution/DistributionEmptyState";
import { DistributionErrorState } from "@/components/features/distribution/DistributionErrorState";
import { DistributionHeader } from "@/components/features/distribution/DistributionHeader";
import { DistributionSkeleton } from "@/components/features/distribution/DistributionSkeleton";
import { DistributionStats } from "@/components/features/distribution/DistributionStats";
import { PublishingCalendar } from "@/components/features/distribution/PublishingCalendar";
import { PublishingComposer } from "@/components/features/distribution/PublishingComposer";
import { useBusinessModule } from "@/hooks/useBusinessModule";
export function DistributionDashboard() {
  const { value, retry } = useBusinessModule("distribution");
  if (value.state === "loading")
    return (
      <>
        <DistributionHeader />
        <DistributionSkeleton />
      </>
    );
  if (value.state === "error")
    return (
      <>
        <DistributionHeader />
        <DistributionErrorState
          message={value.error ?? "Distribution adapter failed."}
          onRetry={retry}
        />
      </>
    );
  if (!value.data)
    return (
      <>
        <DistributionHeader />
        <DistributionEmptyState />
      </>
    );
  return (
    <div className="business-page">
      <DistributionHeader />
      <DataStateBanner value={value} />
      <DistributionStats channels={value.data.channels} />
      <PublishingComposer channels={value.data.channels} />
      <div className="distribution-secondary">
        <PublishingCalendar items={value.data.calendar} />
        <ChannelAnalytics data={value.data.demoAnalytics} />
      </div>
      <div className="business-section-heading">
        <div>
          <span>CHANNEL INVENTORY</span>
          <h2>16 distribution surfaces</h2>
        </div>
        <p>
          Connection status remains not verified unless supported by repository
          evidence.
        </p>
      </div>
      <ChannelGrid channels={value.data.channels} />
    </div>
  );
}
