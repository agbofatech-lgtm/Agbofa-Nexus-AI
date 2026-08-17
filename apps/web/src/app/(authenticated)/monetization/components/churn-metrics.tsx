"use client";

import React from "react";
import { ChurnMetricsData } from "../types";

export interface ChurnMetricsProps {
  metrics: ChurnMetricsData;
}

export function ChurnMetrics({ metrics }: ChurnMetricsProps): React.JSX.Element {
  return (
    <div className="space-y-6 rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
      {/* Top Title & Policy Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2E32] pb-3">
        <div>
          <h3 className="text-base font-bold text-[#FAFAFA]">
            Churn Analytics, Customer Lifetime Value (LTV) & CAC Ledger (IMP-021)
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative financial metric formulas, acquisition assumptions, and subscriber cohort retention
          </p>
        </div>

        <span className="rounded-full bg-[#6C5CE7]/20 px-3 py-1 text-xs font-bold text-[#6C5CE7] border border-[#6C5CE7]/40">
          LTV / CAC Ratio: {(metrics.ltvUsd / metrics.cacUsd).toFixed(0)}x (Elite SaaS Health)
        </span>
      </div>

      {/* 4 Churn & Financial Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Churn Rate */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#0A0A0B] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Monthly Churn Rate
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#CF2020]">
              {metrics.churnRatePercentage}%
            </span>
            <span className="text-xs font-semibold text-[#0D9040]">
              {metrics.churnRateChangePercentage}% improvement
            </span>
          </div>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            {metrics.canceledSubscribersThisMonth} canceled subscriptions this month
          </p>
        </div>

        {/* LTV */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#0A0A0B] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Customer Lifetime Value (LTV)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#0D9040]">
              ${metrics.ltvUsd.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-[#3399FF]">
              ARPU / Churn
            </span>
          </div>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            Avg Revenue Per User (ARPU): ${metrics.arpuUsd.toFixed(2)}
          </p>
        </div>

        {/* CAC with $15 default assumption */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#0A0A0B] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Customer Acquisition Cost (CAC)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#F59E0B]">
              ${metrics.cacUsd.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-[#A0A4A8]">
              Documented Prior
            </span>
          </div>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            Based on authoritative $15.00 default CAC assumption
          </p>
        </div>

        {/* Active Subscribers */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#0A0A0B] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Active Subscriber Cohort
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#3399FF]">
              {metrics.activeSubscribersCount}
            </span>
            <span className="text-xs font-semibold text-[#0D9040]">
              +{metrics.activeSubscribersChange} Net Active
            </span>
          </div>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            {metrics.newSubscribersThisMonth} new vs {metrics.canceledSubscribersThisMonth} canceled
          </p>
        </div>
      </div>

      {/* Formula Invariants & Cohort Comparison Bar */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#0A0A0B] p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-[#3399FF]">
          Authoritative Financial Invariants & Cohort Ratio
        </h4>

        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
          <div className="rounded border border-[#2E2E32] bg-[#12121A] p-3">
            <span className="block font-semibold text-[#A0A4A8]">LTV Formula:</span>
            <code className="font-mono text-[#FAFAFA]">
              LTV = ARPU / ChurnRate
            </code>
            <p className="mt-1 text-[11px] text-[#A0A4A8]">
              $42.50 / 0.024 = $1,770.83 lifetime value per subscriber.
            </p>
          </div>

          <div className="rounded border border-[#2E2E32] bg-[#12121A] p-3">
            <span className="block font-semibold text-[#A0A4A8]">CAC Assumption:</span>
            <code className="font-mono text-[#F59E0B]">
              Default CAC = $15.00
            </code>
            <p className="mt-1 text-[11px] text-[#A0A4A8]">
              Documented prior in IMP-021 RevenueAnalyticsEngine for SaaS benchmarking.
            </p>
          </div>

          <div className="rounded border border-[#2E2E32] bg-[#12121A] p-3">
            <span className="block font-semibold text-[#A0A4A8]">
              New vs. Canceled Ratio:
            </span>
            <code className="font-mono text-[#0D9040]">
              3.83:1 New-to-Churn
            </code>
            <p className="mt-1 text-[11px] text-[#A0A4A8]">
              92 new activations against 24 monthly cancellations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
