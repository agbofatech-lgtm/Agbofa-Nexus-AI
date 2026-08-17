"use client";

import React from "react";
import { SentimentDistribution } from "../types";

export interface SentimentChartProps {
  distribution: SentimentDistribution;
  totalAnalyses: number;
}

export function SentimentChart({
  distribution,
  totalAnalyses,
}: SentimentChartProps): React.JSX.Element {
  const total = Math.max(
    totalAnalyses,
    distribution.positive +
      distribution.negative +
      distribution.neutral +
      distribution.mixed,
    1,
  );

  const posPct = Math.round((distribution.positive / total) * 100);
  const negPct = Math.round((distribution.negative / total) * 100);
  const neuPct = Math.round((distribution.neutral / total) * 100);
  const mixPct = Math.round((distribution.mixed / total) * 100);

  return (
    <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
      <div className="mb-4 flex items-center justify-between border-b border-[#2E2E32] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#FAFAFA]">
            Sentiment &amp; Emotional Polarity Distribution
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            Color-coded analysis across POSITIVE, NEGATIVE, NEUTRAL, and MIXED polarity
          </p>
        </div>
        <span className="rounded-full bg-[#0066CC]/20 px-3 py-1 text-xs font-bold text-[#3399FF]">
          {total.toLocaleString()} Analyses (24h)
        </span>
      </div>

      {/* Proportional Stacked Bar Chart */}
      <div className="mb-6 flex h-8 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
        <div
          className="h-full bg-[#0D9040] transition-all"
          style={{ width: `${posPct}%` }}
          title={`POSITIVE (#0D9040): ${posPct}%`}
        />
        <div
          className="h-full bg-[#CF2020] transition-all"
          style={{ width: `${negPct}%` }}
          title={`NEGATIVE (#CF2020): ${negPct}%`}
        />
        <div
          className="h-full bg-[#A0A4A8] transition-all"
          style={{ width: `${neuPct}%` }}
          title={`NEUTRAL (#A0A4A8): ${neuPct}%`}
        />
        <div
          className="h-full bg-[#6C5CE7] transition-all"
          style={{ width: `${mixPct}%` }}
          title={`MIXED (#6C5CE7): ${mixPct}%`}
        />
      </div>

      {/* 4 Category Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-[#0D9040]/30 bg-[#0D9040]/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9040]">
              POSITIVE
            </span>
            <span className="text-xs font-bold text-[#0D9040]">{posPct}%</span>
          </div>
          <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
            {distribution.positive.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Color token: #0D9040
          </div>
        </div>

        <div className="rounded-lg border border-[#CF2020]/30 bg-[#CF2020]/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#CF2020]">
              NEGATIVE
            </span>
            <span className="text-xs font-bold text-[#CF2020]">{negPct}%</span>
          </div>
          <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
            {distribution.negative.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Color token: #CF2020
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#2E2E32]/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
              NEUTRAL
            </span>
            <span className="text-xs font-bold text-[#A0A4A8]">{neuPct}%</span>
          </div>
          <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
            {distribution.neutral.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Color token: #A0A4A8
          </div>
        </div>

        <div className="rounded-lg border border-[#6C5CE7]/30 bg-[#6C5CE7]/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6C5CE7]">
              MIXED
            </span>
            <span className="text-xs font-bold text-[#6C5CE7]">{mixPct}%</span>
          </div>
          <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
            {distribution.mixed.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Color token: #6C5CE7
          </div>
        </div>
      </div>
    </div>
  );
}

export default SentimentChart;
