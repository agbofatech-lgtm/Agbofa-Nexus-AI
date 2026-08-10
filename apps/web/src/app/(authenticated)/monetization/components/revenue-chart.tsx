"use client";

import React, { useState } from "react";
import { MrrDataPoint } from "../types";

export interface RevenueChartProps {
  trend: MrrDataPoint[];
}

export function RevenueChart({ trend }: RevenueChartProps): React.JSX.Element {
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "12mo">("12mo");

  let displayedTrend = trend;
  if (timeRange === "30d") {
    displayedTrend = trend.slice(-1);
  } else if (timeRange === "90d") {
    displayedTrend = trend.slice(-3);
  }

  const latest = trend[trend.length - 1] || {
    month: "Current",
    mrrUsd: 14620,
    subscriptionRevenueUsd: 11120,
    adRevenueUsd: 3500,
  };

  const arr = latest.mrrUsd * 12; // Invariant formula

  const maxMrr = Math.max(...displayedTrend.map((d) => d.mrrUsd), 15000);

  return (
    <div className="space-y-6 rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
      {/* Top Title, Invariant ARR Display, & Time Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <div>
          <h3 className="text-base font-bold text-[#FAFAFA]">
            Monthly Recurring Revenue (MRR) & Invariant ARR Ledger (IMP-021)
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative time-series revenue tracking with subscription vs advertising stack breakdown
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="rounded border border-[#0D9040]/40 bg-[#0D9040]/10 px-3 py-1 text-right">
            <span className="block text-[10px] uppercase font-bold text-[#A0A4A8]">
              Invariant ARR (MRR × 12)
            </span>
            <span className="font-mono text-base font-extrabold text-[#0D9040]">
              ${arr.toLocaleString()}
            </span>
          </div>

          <div className="flex rounded border border-[#2E2E32] bg-[#0A0A0B] p-1 text-xs font-semibold">
            {(["30d", "90d", "12mo"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`rounded px-2.5 py-1 transition-colors ${
                  timeRange === r
                    ? "bg-[#0066CC] text-white"
                    : "text-[#A0A4A8] hover:text-[#FAFAFA]"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Stacked Bar Chart */}
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-2 h-64 border-b border-[#2E2E32] pb-2 pt-6">
          {displayedTrend.map((pt) => {
            const subPct = (pt.subscriptionRevenueUsd / maxMrr) * 100;
            const adPct = (pt.adRevenueUsd / maxMrr) * 100;

            return (
              <div
                key={pt.month}
                className="group relative flex flex-1 flex-col items-center justify-end h-full"
              >
                {/* Tooltip on Hover */}
                <div className="pointer-events-none absolute bottom-full mb-2 hidden w-36 rounded border border-[#2E2E32] bg-[#0A0A0B] p-2 text-[11px] shadow-lg group-hover:block z-20">
                  <div className="font-bold text-[#FAFAFA]">{pt.month}</div>
                  <div className="flex justify-between text-[#3399FF]">
                    <span>Subs:</span>
                    <span className="font-mono">${pt.subscriptionRevenueUsd}</span>
                  </div>
                  <div className="flex justify-between text-[#0D9040]">
                    <span>Ads:</span>
                    <span className="font-mono">${pt.adRevenueUsd}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#2E2E32] pt-1 font-bold text-[#FAFAFA]">
                    <span>Total MRR:</span>
                    <span className="font-mono">${pt.mrrUsd}</span>
                  </div>
                </div>

                {/* Stacked Bars */}
                <div className="flex w-full max-w-[2.5rem] flex-col justify-end space-y-0.5">
                  <div
                    style={{ height: `${adPct}%` }}
                    className="w-full rounded-t bg-[#0D9040] transition-all duration-300"
                  />
                  <div
                    style={{ height: `${subPct}%` }}
                    className="w-full bg-[#0066CC] transition-all duration-300"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X Axis Labels */}
        <div className="flex justify-between text-[11px] font-mono text-[#A0A4A8]">
          {displayedTrend.map((pt) => (
            <span key={pt.month} className="text-center flex-1 truncate">
              {pt.month}
            </span>
          ))}
        </div>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#2E2E32] pt-4 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded bg-[#0066CC]" />
            <span className="text-[#FAFAFA]">
              Subscription Revenue (76% stack)
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded bg-[#0D9040]" />
            <span className="text-[#FAFAFA]">
              Ad Campaign Revenue (24% stack)
            </span>
          </div>
        </div>

        <span className="text-[11px] text-[#A0A4A8]">
          Invariants: <code className="font-mono text-[#3399FF]">ARR = MRR * 12</code> •{" "}
          <code className="font-mono text-[#0D9040]">
            Total = SubRevenue + AdRevenue
          </code>
        </span>
      </div>
    </div>
  );
}
