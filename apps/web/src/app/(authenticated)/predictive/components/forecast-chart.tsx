"use client";

import React, { useState } from "react";
import { ForecastSeriesPoint } from "../types";

export interface ForecastChartProps {
  data: ForecastSeriesPoint[];
  title?: string;
  metricLabel?: string;
}

export function ForecastChart({
  data,
  title = "Time-Series Predictive Forecast vs Actual Overlay",
  metricLabel = "Engagement Rate (%)",
}: ForecastChartProps): React.JSX.Element {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.predicted, d.actual || 0, d.upperBound)),
    10,
  );

  return (
    <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
      {/* Top Header & Range Selector */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2E32] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#FAFAFA]">{title}</h3>
          <p className="text-xs text-[#A0A4A8]">
            {metricLabel} · Includes Upper/Lower Confidence Interval Band (95% CI)
          </p>
        </div>

        <div className="flex items-center space-x-1 rounded border border-[#2E2E32] bg-[#0A0A0B] p-1 text-xs">
          {(["24h", "7d", "30d"] as const).map((rng) => (
            <button
              key={rng}
              type="button"
              onClick={() => setTimeRange(rng)}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                timeRange === rng
                  ? "bg-[#0066CC] text-white"
                  : "text-[#A0A4A8] hover:text-[#FAFAFA]"
              }`}
            >
              {rng}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Chart with Confidence Band and Predicted vs Actual Overlay */}
      <div className="flex h-44 items-end justify-between gap-2 pt-6">
        {data.map((pt, idx) => {
          const predPct = Math.max(10, Math.min(100, Math.round((pt.predicted / maxVal) * 100)));
          const actualPct = pt.actual
            ? Math.max(10, Math.min(100, Math.round((pt.actual / maxVal) * 100)))
            : null;
          const upPct = Math.min(100, Math.round((pt.upperBound / maxVal) * 100));

          return (
            <div
              key={idx}
              className="group relative flex flex-1 flex-col items-center justify-end space-y-1"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-14 z-20 hidden rounded border border-[#2E2E32] bg-[#0A0A0B] p-1.5 text-center text-[10px] shadow-lg group-hover:block">
                <div className="font-bold text-[#FAFAFA]">{pt.time}</div>
                <div className="text-[#3399FF]">Pred: {pt.predicted}%</div>
                {pt.actual !== undefined && (
                  <div className="text-[#0D9040]">Act: {pt.actual}%</div>
                )}
                <div className="text-[#A0A4A8]">CI: {pt.lowerBound}–{pt.upperBound}%</div>
              </div>

              {/* Upper Bound Marker */}
              <div
                className="w-full border-t border-dashed border-[#6C5CE7]/60"
                style={{ marginBottom: `${Math.max(0, upPct - predPct)}%` }}
                title={`Upper bound: ${pt.upperBound}%`}
              />

              {/* Dual bars: Predicted (Blue) vs Actual (Green) */}
              <div className="flex w-full items-end justify-center space-x-1">
                <div
                  className="w-full rounded-t bg-[#0066CC] transition-all hover:bg-[#3399FF]"
                  style={{ height: `${predPct}%` }}
                  title={`Predicted: ${pt.predicted}%`}
                />
                {actualPct !== null && (
                  <div
                    className="w-full rounded-t bg-[#0D9040] transition-all hover:bg-[#0D9040]/80"
                    style={{ height: `${actualPct}%` }}
                    title={`Actual: ${pt.actual}%`}
                  />
                )}
              </div>

              <div className="text-[10px] text-[#A0A4A8]">{pt.time}</div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-t border-[#2E2E32] pt-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0066CC]" />
          <span className="font-semibold text-[#FAFAFA]">Predicted Rate</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0D9040]" />
          <span className="font-semibold text-[#FAFAFA]">Actual Outcome</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="h-0.5 w-4 border-t border-dashed border-[#6C5CE7]" />
          <span className="text-[#A0A4A8]">Confidence Interval Band (95% CI)</span>
        </div>
      </div>
    </div>
  );
}

export default ForecastChart;
