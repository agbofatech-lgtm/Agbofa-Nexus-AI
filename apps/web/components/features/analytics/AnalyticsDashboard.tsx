"use client";
import { AnalyticsChart } from "@/components/features/analytics/AnalyticsChart";
import { AnalyticsControls } from "@/components/features/analytics/AnalyticsControls";
import { AnalyticsHeader } from "@/components/features/analytics/AnalyticsHeader";
import { AnalyticsOverview } from "@/components/features/analytics/AnalyticsOverview";
import { BusinessInsights } from "@/components/features/analytics/BusinessInsights";
import { ContentAnalytics } from "@/components/features/analytics/ContentAnalytics";
import { BusinessState } from "@/components/features/business/BusinessState";
import { DataStateBanner } from "@/components/features/business/DataStateBanner";
import { useBusinessModule } from "@/hooks/useBusinessModule";
export function AnalyticsDashboard() {
  const { value, retry } = useBusinessModule("analytics");
  if (value.state === "loading")
    return (
      <>
        <AnalyticsHeader />
        <BusinessState state="loading" />
      </>
    );
  if (value.state === "error")
    return (
      <>
        <AnalyticsHeader />
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
        <AnalyticsHeader />
        <BusinessState state="empty" />
      </>
    );
  return (
    <main className="business-page">
      <AnalyticsHeader />
      <DataStateBanner value={value} />
      <AnalyticsControls />
      <AnalyticsOverview items={value.data.overview} />
      <AnalyticsChart series={value.data.series} />
      <div className="analytics-secondary">
        <ContentAnalytics categories={value.data.categories} />
        <BusinessInsights items={value.data.possibleDrivers} />
      </div>
    </main>
  );
}
