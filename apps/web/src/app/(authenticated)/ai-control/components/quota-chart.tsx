"use client";

import React from "react";
import {
  ProviderUsageItem,
  DailyUsageTrendItem,
  SquadUsageItem,
} from "../types";

export interface QuotaChartProps {
  providerUsage: ProviderUsageItem[];
  dailyTrend: DailyUsageTrendItem[];
  squadUsage: SquadUsageItem[];
}

function getProviderColor(provider: string): string {
  switch (provider) {
    case "OpenAI":
      return "bg-[#0066CC] text-[#3399FF]";
    case "Anthropic":
      return "bg-[#6C5CE7] text-[#6C5CE7]";
    case "Google":
      return "bg-[#0D9040] text-[#0D9040]";
    default:
      return "bg-[#A0A4A8] text-[#A0A4A8]";
  }
}

export function QuotaChart({
  providerUsage,
  dailyTrend,
  squadUsage,
}: QuotaChartProps): React.JSX.Element {
  const maxTrendTokens = Math.max(...dailyTrend.map((d) => d.tokens), 1);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 1. Bar Chart: Token Usage by Provider */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
          Token Usage by Provider
        </h3>
        <p className="mb-4 text-xs text-[#A0A4A8]">
          Distribution across authorized LLM backends
        </p>

        <div className="space-y-4">
          {providerUsage.map((p) => {
            const colorClass = getProviderColor(p.provider);
            return (
              <div key={p.provider} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#FAFAFA]">{p.provider}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#A0A4A8]">
                      {(p.tokensUsedToday / 1000).toFixed(1)}k tokens
                    </span>
                    <span className="font-bold text-[#FAFAFA]">
                      {p.percentageOfTotal}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
                  <div
                    className={`h-full ${colorClass.split(" ")[0]} transition-all`}
                    style={{ width: `${p.percentageOfTotal}%` }}
                  />
                </div>
                <div className="text-right text-[11px] text-[#A0A4A8]">
                  Estimated cost: ${p.costUsd.toFixed(2)} USD
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Line / Bar Trend Chart: 7-Day Daily Usage Trend */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
          Daily Token Trend (Last 7 Days)
        </h3>
        <p className="mb-4 text-xs text-[#A0A4A8]">
          Consumption stability &amp; daily rate limits
        </p>

        <div className="flex h-44 items-end justify-between gap-2 pt-4">
          {dailyTrend.map((item, idx) => {
            const heightPct = Math.round((item.tokens / maxTrendTokens) * 100);
            return (
              <div
                key={idx}
                className="flex flex-1 flex-col items-center justify-end space-y-1"
              >
                <div className="text-[10px] font-semibold text-[#A0A4A8]">
                  {(item.tokens / 1000).toFixed(0)}k
                </div>
                <div className="w-full rounded-t bg-[#0066CC] transition-all hover:bg-[#3399FF]"
                  style={{ height: `${Math.max(heightPct, 10)}%` }}
                  title={`${item.date}: ${item.tokens.toLocaleString()} tokens ($${item.costUsd})`}
                />
                <div className="text-[10px] text-[#A0A4A8]">
                  {item.date.split("-").slice(1).join("/")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Distribution Chart: Usage by Agent Squad */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
          Usage by 32-Agent Squad
        </h3>
        <p className="mb-4 text-xs text-[#A0A4A8]">
          Monitors, Detectors, Verification, &amp; Pipeline
        </p>

        {/* Stacked Proportional Bar */}
        <div className="mb-4 flex h-6 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
          {squadUsage.map((s, idx) => {
            const colors = [
              "bg-[#0066CC]",
              "bg-[#6C5CE7]",
              "bg-[#0D9040]",
              "bg-amber-500",
            ];
            return (
              <div
                key={s.squad}
                className={`h-full ${colors[idx % colors.length]} transition-all`}
                style={{ width: `${s.percentageOfTotal}%` }}
                title={`${s.squad}: ${s.percentageOfTotal}%`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs">
          {squadUsage.map((s, idx) => {
            const dotColors = [
              "bg-[#0066CC]",
              "bg-[#6C5CE7]",
              "bg-[#0D9040]",
              "bg-amber-500",
            ];
            return (
              <div
                key={s.squad}
                className="flex items-center justify-between rounded bg-[#0A0A0B] p-2"
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${dotColors[idx % dotColors.length]}`}
                  />
                  <span className="font-bold text-[#FAFAFA]">{s.squad}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[#A0A4A8]">
                    {(s.tokensUsedToday / 1000).toFixed(1)}k
                  </span>
                  <span className="font-bold text-[#FAFAFA]">
                    {s.percentageOfTotal}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default QuotaChart;
