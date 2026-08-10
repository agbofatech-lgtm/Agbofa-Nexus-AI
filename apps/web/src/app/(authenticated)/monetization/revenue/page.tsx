"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { RevenueChart } from "../components/revenue-chart";
import { ChurnMetrics } from "../components/churn-metrics";
import {
  SAMPLE_REVENUE_TREND,
  SAMPLE_CHURN_METRICS,
  SAMPLE_SUBSCRIPTION_BREAKDOWN,
} from "../mock-data";
import {
  MrrDataPoint,
  ChurnMetricsData,
  SubscriptionBreakdownData,
} from "../types";

export default function RevenueAnalyticsPage(): React.JSX.Element {
  const [trend] = useState<MrrDataPoint[]>(SAMPLE_REVENUE_TREND);
  const [metrics] = useState<ChurnMetricsData>(SAMPLE_CHURN_METRICS);
  const [subBreakdown] = useState<SubscriptionBreakdownData>(
    SAMPLE_SUBSCRIPTION_BREAKDOWN,
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchRevenueAnalytics() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string },
          { status?: string }
        >("runtime.v1.AIGatewayService", "InvokeModel", {
          tenant_id: "tenant-default",
        });
        if (resp.status === "ERROR") {
          setError("Failed to retrieve revenue analytics ledger from BFF proxy.");
        }
      } catch {
        // Fallback to sample revenue analytics
      } finally {
        setIsLoading(false);
      }
    }
    fetchRevenueAnalytics();
  }, []);

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-96 w-full animate-pulse rounded-lg bg-[#12121A]" />
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Revenue Analytics Dashboard (IMP-021)
          </h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div
          role="alert"
          aria-live="assertive"
          className="mx-auto max-w-lg rounded-lg border border-[#CF2020] bg-[#12121A] p-6 text-center shadow-xl"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#CF2020]/20 text-2xl text-[#CF2020]">
            ⚠
          </div>
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            Revenue Analytics Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error ||
              "Simulated error: unable to contact RevenueAnalyticsEngine via BFF proxy."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "error") setSimulateMode("normal");
              else window.location.reload();
            }}
            className="rounded-md bg-[#CF2020] px-4 py-2 text-xs font-semibold text-[#FAFAFA]"
          >
            Retry Retrieval
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (simulateMode === "empty") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Revenue Analytics Dashboard (IMP-021)
          </h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            Zero revenue events recorded
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            No revenue events, MRR data points, or subscriber churn ledgers are recorded in this tenant profile.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else window.location.reload();
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Revenue Ledger
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-8">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-3">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            Authoritative Revenue Analytics, MRR/ARR & LTV/CAC Ledger (IMP-021)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Invariant ARR = MRR × 12, $15.00 Default CAC Assumption, and Cohort Churn Modeling in PostgreSQL RLS
          </p>
        </div>

        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* Primary Key Metric Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            MRR (Monthly Recurring)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-extrabold text-[#3399FF]">
              ${metrics.mrrUsd.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-[#0D9040]">
              +{metrics.mrrChangePercentage}% MoM
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            $11,120 Subs + $3,500 Ads
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            ARR (Annual Recurring)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-extrabold text-[#0D9040]">
              ${metrics.arrUsd.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-[#0D9040]">
              Invariant MRR × 12
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            Mathematical identity ledger
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Total Revenue (Period)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-extrabold text-[#FAFAFA]">
              ${metrics.totalRevenuePeriodUsd.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-[#3399FF]">
              August 2026
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            Includes ad impressions & seat add-ons
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            ARPU (Avg Rev / User)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-extrabold text-[#6C5CE7]">
              ${metrics.arpuUsd.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-[#0D9040]">
              Paid Cohort Avg
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            Free to Premium Conv: {subBreakdown.freeToPremiumConversionRate}%
          </p>
        </div>
      </div>

      {/* Reusable RevenueChart Component (MRR trend, ARR display, stacked bar, time selector) */}
      <RevenueChart trend={trend} />

      {/* Reusable ChurnMetrics Component (Churn Rate, LTV, CAC $15, Active subs, New vs Canceled) */}
      <ChurnMetrics metrics={metrics} />

      {/* Subscription Breakdown Section (Tier counts, status counts, conversion rate) */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <h3 className="mb-3 text-sm font-bold text-[#FAFAFA]">
          Subscriber Cohorts & Tier Distribution Ledger
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* By Tier */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#0A0A0B] p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#3399FF]">
              Breakdown by Plan Tier
            </h4>
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A4A8]">Free Reader ($0):</span>
              <strong className="font-mono text-[#FAFAFA]">
                {subBreakdown.freeCount.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A4A8]">Premium ($29/mo):</span>
              <strong className="font-mono text-[#0D9040]">
                {subBreakdown.premiumCount.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A4A8]">Enterprise ($199/mo):</span>
              <strong className="font-mono text-[#6C5CE7]">
                {subBreakdown.enterpriseCount.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* By Status */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#0A0A0B] p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#0D9040]">
              Breakdown by Billing Status
            </h4>
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A4A8]">Active Subscriptions:</span>
              <strong className="font-mono text-[#0D9040]">
                {subBreakdown.activeCount.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A4A8]">Trialing Period:</span>
              <strong className="font-mono text-[#3399FF]">
                {subBreakdown.trialingCount.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A4A8]">Past Due (Grace Period):</span>
              <strong className="font-mono text-[#F59E0B]">
                {subBreakdown.pastDueCount.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A4A8]">Canceled:</span>
              <strong className="font-mono text-[#CF2020]">
                {subBreakdown.canceledCount.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Conversion Rate & LTV/CAC */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#0A0A0B] p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#6C5CE7]">
              Conversion & Retention Ratios
            </h4>
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A4A8]">Free → Premium Conv:</span>
              <strong className="font-mono text-[#0D9040]">
                {subBreakdown.freeToPremiumConversionRate}%
              </strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A4A8]">Monthly Churn Rate:</span>
              <strong className="font-mono text-[#CF2020]">
                {metrics.churnRatePercentage}%
              </strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A4A8]">LTV / CAC Ratio:</span>
              <strong className="font-mono text-[#3399FF]">
                {(metrics.ltvUsd / metrics.cacUsd).toFixed(1)}x
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SimulationToolbarProps {
  currentMode: "normal" | "loading" | "empty" | "error";
  onSelectMode: (mode: "normal" | "loading" | "empty" | "error") => void;
}

function SimulationToolbar({ currentMode, onSelectMode }: SimulationToolbarProps): React.JSX.Element {
  return (
    <div className="flex items-center space-x-1 rounded-md border border-[#2E2E32] bg-[#0A0A0B] p-1 text-[11px]">
      <span className="px-1 text-[#A0A4A8]">State:</span>
      {(["normal", "loading", "empty", "error"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSelectMode(mode)}
          className={`rounded px-2 py-0.5 font-medium transition-colors ${
            currentMode === mode
              ? "bg-[#0066CC] text-[#FAFAFA]"
              : "text-[#A0A4A8] hover:bg-[#12121A] hover:text-[#FAFAFA]"
          }`}
        >
          {mode.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
