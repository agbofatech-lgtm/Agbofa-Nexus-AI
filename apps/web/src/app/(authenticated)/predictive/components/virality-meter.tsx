"use client";

import React from "react";
import { ViralityPredictionItem } from "../types";

export interface ViralityMeterProps {
  predictions: ViralityPredictionItem[];
}

function getTierBadge(tier: string): { label: string; style: string } {
  switch (tier) {
    case "VIRAL":
      return {
        label: "VIRAL (> 0.80)",
        style: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold",
      };
    case "HIGH_POTENTIAL":
      return {
        label: "HIGH POTENTIAL (0.50–0.80)",
        style: "bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/40 font-semibold",
      };
    case "NORMAL":
    default:
      return {
        label: "NORMAL (< 0.50)",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-medium",
      };
  }
}

export function ViralityMeter({ predictions }: ViralityMeterProps): React.JSX.Element {
  const viralCount = predictions.filter((p) => p.tier === "VIRAL").length;
  const highCount = predictions.filter((p) => p.tier === "HIGH_POTENTIAL").length;
  const normCount = predictions.filter((p) => p.tier === "NORMAL").length;
  const total = Math.max(predictions.length, 1);

  const virPct = Math.round((viralCount / total) * 100);
  const highPct = Math.round((highCount / total) * 100);
  const normPct = Math.round((normCount / total) * 100);

  return (
    <div className="space-y-6">
      {/* 3-Tier Distribution Bar */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <div className="mb-4 flex items-center justify-between border-b border-[#2E2E32] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              PRED-001 Virality Prediction Tier Distribution ({total} evaluated)
            </h3>
            <p className="text-xs text-[#A0A4A8]">
              MAPE-calibrated forecasts across VIRAL, HIGH_POTENTIAL, and NORMAL tiers
            </p>
          </div>
          <span className="rounded-full bg-[#0066CC]/20 px-3 py-1 text-xs font-bold text-[#3399FF]">
            {virPct}% VIRAL FORECASTS
          </span>
        </div>

        {/* Proportional bar */}
        <div className="mb-6 flex h-8 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
          <div
            className="h-full bg-[#CF2020] transition-all"
            style={{ width: `${virPct}%` }}
            title={`VIRAL (#CF2020): ${virPct}%`}
          />
          <div
            className="h-full bg-[#0066CC] transition-all"
            style={{ width: `${highPct}%` }}
            title={`HIGH POTENTIAL (#0066CC): ${highPct}%`}
          />
          <div
            className="h-full bg-[#0D9040] transition-all"
            style={{ width: `${normPct}%` }}
            title={`NORMAL (#0D9040): ${normPct}%`}
          />
        </div>

        {/* 3 Tier Stat Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[#CF2020]/30 bg-[#CF2020]/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#CF2020]">
                VIRAL (&gt; 0.80)
              </span>
              <span className="text-xs font-bold text-[#CF2020]">{virPct}%</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
              {viralCount}
            </div>
            <div className="mt-1 text-[11px] text-[#A0A4A8]">
              High amplification forecast
            </div>
          </div>

          <div className="rounded-lg border border-[#0066CC]/30 bg-[#0066CC]/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#3399FF]">
                HIGH POTENTIAL (0.50–0.80)
              </span>
              <span className="text-xs font-bold text-[#3399FF]">
                {highPct}%
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
              {highCount}
            </div>
            <div className="mt-1 text-[11px] text-[#A0A4A8]">
              Accelerating engagement
            </div>
          </div>

          <div className="rounded-lg border border-[#0D9040]/30 bg-[#0D9040]/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D9040]">
                NORMAL (&lt; 0.50)
              </span>
              <span className="text-xs font-bold text-[#0D9040]">
                {normPct}%
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
              {normCount}
            </div>
            <div className="text-[11px] text-[#A0A4A8]">
              Nominal organic baseline
            </div>
          </div>
        </div>
      </div>

      {/* Recent Predictions Ledger with Scores & Fallback Indicators */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
          Recent Virality Predictions — MAPE Score vs Confidence &amp; Fallback Status
        </h3>

        <div className="divide-y divide-[#2E2E32]">
          {predictions.map((p) => {
            const tierBadge = getTierBadge(p.tier);
            return (
              <div
                key={p.id}
                className="flex flex-col justify-between gap-2 py-3 text-xs sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#FAFAFA]">{p.title}</span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ${tierBadge.style}`}
                    >
                      {p.tier}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center space-x-2 text-[11px] text-[#A0A4A8]">
                    <span>Score: <strong className="text-[#3399FF]">{(p.score * 100).toFixed(0)}%</strong></span>
                    <span>·</span>
                    <span>Confidence: <strong className="text-[#0D9040]">{(p.confidence * 100).toFixed(0)}%</strong></span>
                    <span>·</span>
                    <span>Reach: <strong className="text-[#FAFAFA]">{p.estimatedReach.toLocaleString()}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {p.isFallbackTriggered ? (
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/40">
                      ⚡ AGT-016 FALLBACK
                    </span>
                  ) : (
                    <span className="rounded bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040] border border-[#0D9040]/30">
                      ✓ NEURAL PRIMARY
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ViralityMeter;
