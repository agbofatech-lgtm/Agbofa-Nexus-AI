"use client";

import React from "react";
import { ViralityDistribution, ViralityPredictionItem } from "../types";

export interface ViralityMeterProps {
  distribution: ViralityDistribution;
  predictions: ViralityPredictionItem[];
}

function getTierStyle(tier: string): { label: string; style: string } {
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

export function ViralityMeter({
  distribution,
  predictions,
}: ViralityMeterProps): React.JSX.Element {
  const total = Math.max(
    distribution.viral + distribution.highPotential + distribution.normal,
    1,
  );
  const virPct = Math.round((distribution.viral / total) * 100);
  const highPct = Math.round((distribution.highPotential / total) * 100);
  const normPct = Math.round((distribution.normal / total) * 100);

  return (
    <div className="space-y-6">
      {/* 3-Tier Distribution Bar */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <div className="mb-4 flex items-center justify-between border-b border-[#2E2E32] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              Virality MAPE Prediction Distribution
            </h3>
            <p className="text-xs text-[#A0A4A8]">
              Three-tier trajectory forecasting across VIRAL, HIGH_POTENTIAL, and NORMAL
            </p>
          </div>
          <span className="rounded-full bg-[#0066CC]/20 px-3 py-1 text-xs font-bold text-[#3399FF]">
            {total} Active Forecasts
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
              {distribution.viral}
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
              {distribution.highPotential}
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
              {distribution.normal}
            </div>
            <div className="text-[11px] text-[#A0A4A8]">
              Nominal organic baseline
            </div>
          </div>
        </div>
      </div>

      {/* Recent Predictions Ledger with Scores vs Actual Outcomes */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
          Recent MAPE Virality Predictions — Score vs Actual Outcome Comparison
        </h3>

        <div className="divide-y divide-[#2E2E32]">
          {predictions.map((p) => {
            const outcomeStyle = getTierStyle(p.actualOutcome);
            return (
              <div
                key={p.id}
                className="flex flex-col justify-between gap-2 py-3 text-xs sm:flex-row sm:items-center"
              >
                <div>
                  <span className="font-bold text-[#FAFAFA]">{p.title}</span>
                  <div className="mt-1 flex items-center space-x-2 text-[11px] text-[#A0A4A8]">
                    <span>Evaluated at {new Date(p.evaluatedAt).toLocaleTimeString()}</span>
                    <span>·</span>
                    <span>Predicted Score: <strong className="text-[#3399FF]">{(p.predictedScore * 100).toFixed(0)}%</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-[#A0A4A8]">Actual Outcome:</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] ${outcomeStyle.style}`}
                  >
                    {outcomeStyle.label}
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

export default ViralityMeter;
