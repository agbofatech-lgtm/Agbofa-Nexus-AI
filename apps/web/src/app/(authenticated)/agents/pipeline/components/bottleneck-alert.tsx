"use client";

import React from "react";
import { BottleneckAlertData } from "../types";

export interface BottleneckAlertProps {
  data: BottleneckAlertData;
  onApplyAutoScale?: () => void;
}

function getSeverityBadge(sev: string): { label: string; style: string } {
  switch (sev) {
    case "CRITICAL":
      return {
        label: "CRITICAL BOTTLENECK",
        style: "bg-[#CF2020] text-white font-bold animate-pulse",
      };
    case "HIGH":
      return {
        label: "HIGH SEVERITY BOTTLENECK",
        style: "bg-amber-500 text-black font-bold animate-pulse",
      };
    case "MEDIUM":
      return {
        label: "MEDIUM QUEUE BACKPRESSURE",
        style: "bg-[#3399FF]/20 text-[#3399FF] border border-[#3399FF]/40 font-semibold",
      };
    case "LOW":
    default:
      return {
        label: "LOW VARIANCE",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-semibold",
      };
  }
}

export function BottleneckAlert({
  data,
  onApplyAutoScale,
}: BottleneckAlertProps): React.JSX.Element {
  const badge = getSeverityBadge(data.severity);

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold text-amber-400">⚠</span>
            <span
              className={`inline-flex rounded-full px-3 py-0.5 text-xs ${badge.style}`}
            >
              {badge.label}
            </span>
          </div>
          <h3 className="mt-2 text-base font-bold text-[#FAFAFA]">
            Active Pipeline Constraint: {data.stageName}
          </h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#A0A4A8]">Queue Depth:</div>
          <div className="font-mono text-xl font-bold text-amber-400">
            {data.queueDepth.toLocaleString()} items
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
        <div className="rounded border border-amber-500/30 bg-[#0A0A0B] p-3">
          <span className="font-bold text-amber-300">Processing Rate:</span>
          <div className="mt-1 text-lg font-bold text-[#FAFAFA]">
            {data.processingRatePerHour.toLocaleString()} items/hour
          </div>
          <span className="text-[10px] text-[#A0A4A8]">Current throughput capacity</span>
        </div>

        <div className="rounded border border-amber-500/30 bg-[#0A0A0B] p-3">
          <span className="font-bold text-amber-300">Historical Frequency:</span>
          <div className="mt-1 text-lg font-bold text-[#FAFAFA]">
            {data.historicalFrequencyPct}%
          </div>
          <span className="text-[10px] text-[#A0A4A8]">Time spent bottlenecked (last 30d)</span>
        </div>

        <div className="rounded border border-amber-500/30 bg-[#0A0A0B] p-3">
          <span className="font-bold text-amber-300">Auto-Scale Advisory:</span>
          <div className="mt-1 font-semibold text-[#FAFAFA]">
            {data.autoScaleRecommendation}
          </div>
          <span className="text-[10px] text-[#A0A4A8]">AIGatewayService worker scaling</span>
        </div>
      </div>

      {onApplyAutoScale && (
        <div className="mt-4 flex items-center justify-end border-t border-amber-500/30 pt-3">
          <button
            type="button"
            onClick={onApplyAutoScale}
            className="rounded bg-amber-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-amber-400"
          >
            ⚡ Execute Auto-Scale Recommendation
          </button>
        </div>
      )}
    </div>
  );
}

export default BottleneckAlert;
