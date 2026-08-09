"use client";

import React from "react";
import { QuotaHistoryPoint } from "../types";

export interface PlatformHealthProps {
  rateLimit: {
    used: number;
    total: number;
    resetTime: string;
  };
  apiStatus: "CONNECTED" | "DEGRADED" | "DISCONNECTED";
  quotaHistory?: QuotaHistoryPoint[];
}

function getApiStatusBadge(status: string): { label: string; style: string } {
  switch (status) {
    case "CONNECTED":
      return {
        label: "CONNECTED",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-bold",
      };
    case "DEGRADED":
      return {
        label: "DEGRADED",
        style: "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold",
      };
    case "DISCONNECTED":
    default:
      return {
        label: "DISCONNECTED",
        style: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold animate-pulse",
      };
  }
}

function getQuotaColor(percentage: number): { text: string; bg: string } {
  if (percentage < 50) {
    return { text: "text-[#0D9040]", bg: "bg-[#0D9040]" };
  }
  if (percentage <= 80) {
    return { text: "text-amber-400", bg: "bg-amber-500" };
  }
  return { text: "text-[#CF2020]", bg: "bg-[#CF2020]" };
}

export function PlatformHealth({
  rateLimit,
  apiStatus,
  quotaHistory = [
    { timestamp: "00:00", usagePct: 15 },
    { timestamp: "04:00", usagePct: 28 },
    { timestamp: "08:00", usagePct: 45 },
    { timestamp: "12:00", usagePct: 62 },
    { timestamp: "16:00", usagePct: 55 },
    { timestamp: "20:00", usagePct: 48 },
  ],
}: PlatformHealthProps): React.JSX.Element {
  const pct = Math.min(
    100,
    Math.round((rateLimit.used / rateLimit.total) * 100),
  );
  const badge = getApiStatusBadge(apiStatus);
  const quotaColor = getQuotaColor(pct);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Card 1: API Status & Reset Timer */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Platform API Connector Health
          </span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${badge.style}`}
          >
            ● {badge.label}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between border-b border-[#2E2E32] pb-1.5">
            <span className="text-[#A0A4A8]">Window Reset Timer:</span>
            <span className="font-mono font-bold text-[#3399FF]">
              {rateLimit.resetTime}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#2E2E32] pb-1.5">
            <span className="text-[#A0A4A8]">OAuth / App Credentials:</span>
            <span className="font-bold text-[#0D9040]">AUTHENTICATED</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#A0A4A8]">RLS Tenant Boundary:</span>
            <span className="font-mono text-[#FAFAFA]">tenant-default</span>
          </div>
        </div>
      </div>

      {/* Card 2: Quota Utilization Gauge */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Platform Rate Limit Quota
          </span>
          <span className={`text-xs font-bold ${quotaColor.text}`}>
            {pct}% UTILIZED
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#FAFAFA]">
              {rateLimit.used.toLocaleString()}
            </span>
            <span className="text-xs text-[#A0A4A8]">
              / {rateLimit.total.toLocaleString()} limit
            </span>
          </div>

          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
            <div
              className={`h-full ${quotaColor.bg} transition-all`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-2 flex justify-between text-[11px] text-[#A0A4A8]">
            <span>0%</span>
            <span>50% (Amber)</span>
            <span>80% (Red Cap)</span>
          </div>
        </div>
      </div>

      {/* Card 3: 24h Quota Utilization Sparkline */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            24h Quota Usage History
          </span>
          <span className="text-[10px] text-[#A0A4A8]">6-Point Sparkline</span>
        </div>

        <div className="flex h-20 items-end justify-between gap-1.5 pt-2">
          {quotaHistory.map((item, idx) => {
            const hPct = Math.max(12, Math.min(100, item.usagePct));
            const color = getQuotaColor(item.usagePct).bg;
            return (
              <div
                key={idx}
                className="flex flex-1 flex-col items-center justify-end space-y-1"
              >
                <div className="text-[10px] font-bold text-[#FAFAFA]">
                  {item.usagePct}%
                </div>
                <div
                  className={`w-full rounded-t ${color} transition-all`}
                  style={{ height: `${hPct}%` }}
                  title={`${item.timestamp}: ${item.usagePct}% utilized`}
                />
                <div className="text-[9px] text-[#A0A4A8]">
                  {item.timestamp}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PlatformHealth;
