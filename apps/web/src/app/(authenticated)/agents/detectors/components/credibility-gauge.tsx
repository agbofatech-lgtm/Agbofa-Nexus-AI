"use client";

import React from "react";
import { CredibilityScoreData } from "../types";

export interface CredibilityGaugeProps {
  data: CredibilityScoreData;
}

function getTierStyle(tier: string): {
  color: string;
  stroke: string;
  badge: string;
  label: string;
} {
  switch (tier) {
    case "HIGH":
      return {
        color: "text-[#0D9040]",
        stroke: "#0D9040",
        badge: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40",
        label: "HIGH (> 0.80)",
      };
    case "MEDIUM":
      return {
        color: "text-amber-400",
        stroke: "#F59E0B",
        badge: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
        label: "MEDIUM (0.50–0.80)",
      };
    case "LOW":
      return {
        color: "text-[#CF2020]",
        stroke: "#CF2020",
        badge: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40",
        label: "LOW (< 0.50)",
      };
    case "UNKNOWN":
    default:
      return {
        color: "text-[#A0A4A8]",
        stroke: "#A0A4A8",
        badge: "bg-[#2E2E32]/50 text-[#A0A4A8] border border-[#2E2E32]",
        label: "UNKNOWN",
      };
  }
}

export function CredibilityGauge({ data }: CredibilityGaugeProps): React.JSX.Element {
  const percentage = Math.round(data.avgScore * 100);
  const style = getTierStyle(data.tier);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, percentage) / 100) * circumference;

  return (
    <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
      <div className="mb-4 flex items-center justify-between border-b border-[#2E2E32] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#FAFAFA]">
            Source Credibility Score &amp; Tier Classification
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            Color-coded assessment across HIGH, MEDIUM, LOW, and UNKNOWN tiers
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}
        >
          {style.label}
        </span>
      </div>

      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
        {/* Circular SVG Gauge (1 column) */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative flex h-36 w-36 items-center justify-center">
            <svg
              className="h-full w-full -rotate-90 transform"
              viewBox="0 0 120 120"
            >
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#2E2E32"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke={style.stroke}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-2xl font-bold ${style.color}`}>
                {(data.avgScore * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] font-semibold text-[#A0A4A8]">
                CREDIBILITY
              </span>
            </div>
          </div>
        </div>

        {/* Credibility Tier Distribution Counts (2 columns) */}
        <div className="grid grid-cols-2 gap-3 md:col-span-2">
          <div className="rounded border border-[#0D9040]/30 bg-[#0D9040]/10 p-3">
            <div className="text-xs font-bold text-[#0D9040]">
              HIGH (&gt;0.80) — #0D9040
            </div>
            <div className="mt-1 text-xl font-bold text-[#FAFAFA]">
              {data.distribution.high}
            </div>
            <div className="text-[10px] text-[#A0A4A8]">Verified primary sources</div>
          </div>

          <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="text-xs font-bold text-amber-400">
              MEDIUM (0.50–0.80) — #F59E0B
            </div>
            <div className="mt-1 text-xl font-bold text-[#FAFAFA]">
              {data.distribution.medium}
            </div>
            <div className="text-[10px] text-[#A0A4A8]">Secondary / syndicated</div>
          </div>

          <div className="rounded border border-[#CF2020]/30 bg-[#CF2020]/10 p-3">
            <div className="text-xs font-bold text-[#CF2020]">
              LOW (&lt;0.50) — #CF2020
            </div>
            <div className="mt-1 text-xl font-bold text-[#FAFAFA]">
              {data.distribution.low}
            </div>
            <div className="text-[10px] text-[#A0A4A8]">Unverified / anomalous</div>
          </div>

          <div className="rounded border border-[#2E2E32] bg-[#2E2E32]/40 p-3">
            <div className="text-xs font-bold text-[#A0A4A8]">
              UNKNOWN — #A0A4A8
            </div>
            <div className="mt-1 text-xl font-bold text-[#FAFAFA]">
              {data.distribution.unknown}
            </div>
            <div className="text-[10px] text-[#A0A4A8]">New originators</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CredibilityGauge;
