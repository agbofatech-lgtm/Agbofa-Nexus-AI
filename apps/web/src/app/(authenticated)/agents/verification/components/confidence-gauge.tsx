"use client";

import React from "react";
import { ConfidenceFactorBreakdown } from "../types";

export interface ConfidenceGaugeProps {
  score: number; // 0.0 to 1.0
  tier: "VERIFIED_TRUTH" | "PROVISIONAL" | "DOUBTFUL";
  breakdown: ConfidenceFactorBreakdown;
  size?: "sm" | "md" | "lg";
}

function getTierStyle(tier: string): { color: string; stroke: string; label: string; bg: string } {
  switch (tier) {
    case "VERIFIED_TRUTH":
      return {
        color: "text-[#0D9040]",
        stroke: "#0D9040",
        label: "VERIFIED TRUTH",
        bg: "bg-[#0D9040]/20 border-[#0D9040]/40",
      };
    case "PROVISIONAL":
      return {
        color: "text-[#3399FF]",
        stroke: "#3399FF",
        label: "PROVISIONAL",
        bg: "bg-[#3399FF]/20 border-[#3399FF]/40",
      };
    case "DOUBTFUL":
    default:
      return {
        color: "text-[#CF2020]",
        stroke: "#CF2020",
        label: "DOUBTFUL",
        bg: "bg-[#CF2020]/20 border-[#CF2020]/40",
      };
  }
}

export function ConfidenceGauge({
  score,
  tier,
  breakdown,
  size = "md",
}: ConfidenceGaugeProps): React.JSX.Element {
  const percentage = Math.round(score * 100);
  const style = getTierStyle(tier);

  const radius = size === "lg" ? 55 : size === "sm" ? 35 : 45;
  const strokeWidth = size === "lg" ? 12 : 10;
  const dim = size === "lg" ? 160 : size === "sm" ? 100 : 130;
  const center = dim / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, percentage) / 100) * circumference;

  const factors = [
    {
      name: "Fact-Check Verdict (AGT-017) — 30% weight",
      score: breakdown.factCheckScore,
      color: "bg-[#0D9040]",
    },
    {
      name: "Cross-Reference Corroboration (AGT-018) — 25% weight",
      score: breakdown.crossRefScore,
      color: "bg-[#3399FF]",
    },
    {
      name: "Source Authenticity & Authority (AGT-019) — 20% weight",
      score: breakdown.sourceScore,
      color: "bg-[#6C5CE7]",
    },
    {
      name: "Evidence Strength Ledger (AGT-021) — 15% weight",
      score: breakdown.evidenceScore,
      color: "bg-amber-500",
    },
    {
      name: "Bias Impact (Inverted) (AGT-022) — 10% weight",
      score: breakdown.biasScore,
      color: "bg-[#FAFAFA]",
    },
  ];

  return (
    <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
      {/* Top Header */}
      <div className="mb-4 flex items-center justify-between border-b border-[#2E2E32] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#FAFAFA]">
            Authoritative AGT-024 Confidence Score
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            5-factor weighted verification model (30 / 25 / 20 / 15 / 10)
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold border ${style.bg} ${style.color}`}
        >
          {style.label}
        </span>
      </div>

      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
        {/* SVG Gauge */}
        <div className="flex flex-col items-center justify-center text-center">
          <div
            className="relative flex items-center justify-center"
            style={{ width: dim, height: dim }}
          >
            <svg
              className="h-full w-full -rotate-90 transform"
              viewBox={`0 0 ${dim} ${dim}`}
            >
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#2E2E32"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke={style.stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-2xl font-bold ${style.color}`}>
                {percentage}%
              </span>
              <span className="text-[10px] font-semibold text-[#A0A4A8]">
                CONFIDENCE
              </span>
            </div>
          </div>
        </div>

        {/* 5-Factor Weighted Progress Bars (2 cols) */}
        <div className="space-y-3 md:col-span-2">
          {factors.map((f, idx) => {
            const pct = Math.round(f.score * 100);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#FAFAFA]">{f.name}</span>
                  <span className="font-mono font-bold text-[#3399FF]">
                    {pct}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
                  <div
                    className={`h-full ${f.color} transition-all`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ConfidenceGauge;
