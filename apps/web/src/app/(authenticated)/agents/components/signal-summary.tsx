"use client";

import React from "react";
import { HourlyDataPoint, TopKeyword } from "../types";

export interface SignalSummaryProps {
  totalSignals: number;
  byType: Array<{ type: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  hourlyData: HourlyDataPoint[];
  topKeywords?: TopKeyword[];
}

export function SignalSummary({
  totalSignals,
  byType,
  byPriority,
  hourlyData,
  topKeywords = [
    { keyword: "#AgbofaNexus", count: 142, category: "TOPIC" },
    { keyword: "32-Agent Workforce", count: 98, category: "ENTITY" },
    { keyword: "Compute Cluster", count: 64, category: "ENTITY" },
    { keyword: "Row-Level Security", count: 53, category: "TOPIC" },
  ],
}: SignalSummaryProps): React.JSX.Element {
  const maxHourly = Math.max(...hourlyData.map((d) => d.signals), 1);
  const breakingCount =
    byType.find((t) => t.type === "BREAKING")?.count || 0;
  const trendCount = byType.find((t) => t.type === "TREND")?.count || 0;
  const c1Count = byPriority.find((p) => p.priority === "C1")?.count || 0;

  return (
    <div className="space-y-6">
      {/* Stat Cards Row (4 columns) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Total Ingested (24h)
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {totalSignals.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#A0A4A8]">
            Cross-platform signals
          </div>
        </div>

        <div className="rounded-lg border border-[#CF2020]/40 bg-[#CF2020]/10 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#CF2020]">
            Breaking Signals
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {breakingCount}
          </div>
          <div className="text-[11px] text-[#CF2020]">
            C1 Critical Priority ({c1Count})
          </div>
        </div>

        <div className="rounded-lg border border-[#0066CC]/40 bg-[#0066CC]/10 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#3399FF]">
            Viral Trend Signals
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {trendCount}
          </div>
          <div className="text-[11px] text-[#3399FF]">
            Viral trajectory velocity
          </div>
        </div>

        <div className="rounded-lg border border-[#6C5CE7]/40 bg-[#6C5CE7]/10 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6C5CE7]">
            Entity Extraction
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {topKeywords.length}
          </div>
          <div className="text-[11px] text-[#6C5CE7]">
            Top tracked entities
          </div>
        </div>
      </div>

      {/* Grid: Hourly Distribution Chart (2 cols) & Top Keywords (1 col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 24h Hourly Ingestion Chart */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
              Hourly Ingestion Distribution (Last 24 Hours)
            </h3>
            <span className="text-[11px] text-[#3399FF]">
              Peak: {maxHourly} signals/hr
            </span>
          </div>

          <div className="flex h-36 items-end justify-between gap-1.5 pt-4">
            {hourlyData.map((d, i) => {
              const hPct = Math.max(12, Math.min(100, Math.round((d.signals / maxHourly) * 100)));
              return (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center justify-end space-y-1"
                >
                  <div
                    className="w-full rounded-t bg-[#0066CC] transition-all hover:bg-[#3399FF]"
                    style={{ height: `${hPct}%` }}
                    title={`${d.hour}: ${d.signals} signals detected`}
                  />
                  <div className="text-[9px] text-[#A0A4A8]">{d.hour}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Keywords / Entities */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow lg:col-span-1">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
            Top Detected Entities &amp; Keywords
          </h3>
          <div className="space-y-2.5">
            {topKeywords.map((kw) => (
              <div
                key={kw.keyword}
                className="flex items-center justify-between rounded border border-[#2E2E32] bg-[#0A0A0B] p-2.5 text-xs"
              >
                <div>
                  <span className="font-bold text-[#FAFAFA]">{kw.keyword}</span>
                  <span className="ml-2 rounded bg-[#12121A] px-1.5 py-0.5 text-[9px] font-semibold text-[#3399FF] border border-[#2E2E32]">
                    {kw.category}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[#0D9040]">
                  {kw.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignalSummary;
