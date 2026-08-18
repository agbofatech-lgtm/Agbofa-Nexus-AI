"use client";
import { DataStateBanner } from "@/components/features/business/DataStateBanner";
import { BusinessState } from "@/components/features/business/BusinessState";
import { ChurnAnalysis } from "@/components/features/monetization/ChurnAnalysis";
import { MonetizationCampaigns } from "@/components/features/monetization/MonetizationCampaigns";
import { MonetizationHeader } from "@/components/features/monetization/MonetizationHeader";
import { PaywallConfiguration } from "@/components/features/monetization/PaywallConfiguration";
import { RevenueDashboard } from "@/components/features/monetization/RevenueDashboard";
import { SubscriptionPlans } from "@/components/features/monetization/SubscriptionPlans";
import { useBusinessModule } from "@/hooks/useBusinessModule";
export function MonetizationDashboard() {
  const { value, retry } = useBusinessModule("monetization");
  if (value.state === "loading")
    return (
      <>
        <MonetizationHeader />
        <BusinessState state="loading" />
      </>
    );
  if (value.state === "error")
    return (
      <>
        <MonetizationHeader />
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
        <MonetizationHeader />
        <BusinessState state="empty" />
      </>
    );
  return (
    <div className="business-page">
      <MonetizationHeader />
      <DataStateBanner value={value} />
      <RevenueDashboard data={value.data} />
      <SubscriptionPlans plans={value.data.plans} />
      <div className="monetization-grid">
        <PaywallConfiguration initial={value.data.paywall} />
        <div>
          <MonetizationCampaigns campaigns={value.data.campaigns} />
          <ChurnAnalysis />
        </div>
      </div>
    </div>
  );
}
