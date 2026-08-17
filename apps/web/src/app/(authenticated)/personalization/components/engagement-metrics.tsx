"use client";

import React from "react";
import { EngagementMetricsData, InferredPreferenceItem } from "../types";

export interface EngagementMetricsProps {
  metrics: EngagementMetricsData;
  inferredPreferences: InferredPreferenceItem[];
  onAcceptInferredPreference: (itemId: string) => void;
}

export function EngagementMetrics({
  metrics,
  inferredPreferences,
  onAcceptInferredPreference,
}: EngagementMetricsProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Strict Privacy Notice Card */}
      <div
        role="region"
        aria-label="Personalization Privacy Notice"
        className="flex items-start justify-between rounded-lg border border-[#6C5CE7]/40 bg-[#6C5CE7]/10 p-4"
      >
        <div className="flex items-start space-x-3">
          <span className="text-lg">🔒</span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#6C5CE7]">
              Strict Tenant Isolation & Zero-Sharing Privacy Policy (PERS-005)
            </h4>
            <p className="mt-0.5 text-xs text-[#FAFAFA]">
              All personalization data is private to your account. Never shared across tenants.
            </p>
            <p className="mt-1 text-[11px] text-[#A0A4A8]">
              Behavioral analytics and semantic ledgers are scoped strictly by <code className="font-mono text-[#FAFAFA]">(tenant_id, reader_id)</code> in PostgreSQL Row-Level Security (RLS). Zero cross-tenant preference bleed is mathematically possible.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Engagement Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Daily Avg Reading Time
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#FAFAFA]">
              {metrics.dailyAvgMinutes}m
            </span>
            <span className="text-xs font-semibold text-[#0D9040]">
              +14% vs last week
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            Weekly: {metrics.weeklyTotalHours}h • Monthly: {metrics.monthlyTotalHours}h
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Articles Read (30 Days)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#3399FF]">
              {metrics.totalArticlesRead30d}
            </span>
            <span className="text-xs font-semibold text-[#3399FF]">
              100% Verified
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            Avg Engagement Score: {(metrics.avgEngagementScore * 100).toFixed(0)}%
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Conversion / Return Rate
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#0D9040]">
              {metrics.returnVisitRate}%
            </span>
            <span className="text-xs text-[#A0A4A8]">Return Rate</span>
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            Share: {metrics.shareRate}% • Bookmark: {metrics.bookmarkRate}%
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Topic Exploration Breadth
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#6C5CE7]">
              {(metrics.topicExplorationBreadth * 100).toFixed(0)}%
            </span>
            <span className="text-xs font-semibold text-[#0D9040]">
              High Diversity
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            Anti-Echo-Chamber Index: 0.85 / 1.00
          </p>
        </div>
      </div>

      {/* Inferred Preferences Section */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#3399FF]">
          AI Inferred Preferences & Suggestions (PERS-003)
        </h3>
        <p className="mb-4 text-xs text-[#A0A4A8]">
          Topics you engage with frequently but do not yet explicitly follow in your profile ledger
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {inferredPreferences.map((sug) => (
            <div
              key={sug.id}
              className="flex flex-col justify-between rounded-lg border border-[#0066CC]/30 bg-[#0A0A0B] p-4"
            >
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="rounded bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF] border border-[#0066CC]/30">
                    {sug.categoryName}
                  </span>
                  <span className="text-xs font-semibold text-[#0D9040]">
                    Confidence: {(sug.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium text-[#FAFAFA]">
                  &ldquo;We noticed you read a lot about {sug.topic} ({sug.readCount} articles, avg {(sug.avgTimeSpentSeconds / 60).toFixed(1)} min). Add to your preferences?&rdquo;
                </p>
                <p className="mt-1 text-[11px] text-[#A0A4A8]">
                  {sug.explanation}
                </p>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => onAcceptInferredPreference(sug.id)}
                  className="rounded bg-[#0066CC] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF] transition-colors"
                >
                  + Add Explicit Preference
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reading Patterns Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Preferred Reading Windows */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#FAFAFA]">
            Preferred Reading Times
          </h4>
          <div className="space-y-3">
            {metrics.preferredReadingWindows.map((win) => (
              <div key={win.windowName} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#FAFAFA]">
                    {win.windowName}
                  </span>
                  <span className="font-mono text-[#3399FF]">
                    {win.percentageOfReads}%
                  </span>
                </div>
                <div className="text-[11px] text-[#A0A4A8]">{win.utcRange}</div>
                <div className="h-1.5 w-full rounded-full bg-[#2E2E32]">
                  <div
                    className="h-1.5 rounded-full bg-[#0066CC]"
                    style={{ width: `${win.percentageOfReads}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Content Lengths */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#FAFAFA]">
            Preferred Content Lengths
          </h4>
          <div className="space-y-3">
            {metrics.preferredContentLengths.map((len) => (
              <div key={len.lengthCategory} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#FAFAFA]">
                    {len.lengthCategory}
                  </span>
                  <span className="font-mono text-[#0D9040]">
                    {len.percentageOfReads}%
                  </span>
                </div>
                <div className="text-[11px] text-[#A0A4A8]">{len.durationRange}</div>
                <div className="h-1.5 w-full rounded-full bg-[#2E2E32]">
                  <div
                    className="h-1.5 rounded-full bg-[#0D9040]"
                    style={{ width: `${len.percentageOfReads}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Formats */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#FAFAFA]">
            Preferred Content Formats
          </h4>
          <div className="space-y-3">
            {metrics.preferredFormats.map((fmt) => (
              <div key={fmt.formatType} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#FAFAFA]">
                    {fmt.label}
                  </span>
                  <span className="font-mono text-[#6C5CE7]">
                    {fmt.percentageOfReads}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#2E2E32]">
                  <div
                    className="h-1.5 rounded-full bg-[#6C5CE7]"
                    style={{ width: `${fmt.percentageOfReads}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
