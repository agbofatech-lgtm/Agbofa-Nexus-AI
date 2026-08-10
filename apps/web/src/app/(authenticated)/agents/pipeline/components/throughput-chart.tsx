"use client";

import React, { useState } from "react";
import { PipelineStageFlowItem } from "../types";

export interface ThroughputChartProps {
  stages: PipelineStageFlowItem[];
}

export function ThroughputChart({ stages }: ThroughputChartProps): React.JSX.Element {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");

  const multiplier =
    timeRange === "1h"
      ? 0.05
      : timeRange === "7d"
      ? 6.8
      : timeRange === "30d"
      ? 28.5
      : 1;

  return (
    <div className="space-y-6">
      {/* Top Header & Time Range Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
        <div>
          <h3 className="text-sm font-bold text-[#FAFAFA]">
            Authoritative End-to-End Throughput Velocity ({timeRange.toUpperCase()} Window)
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            Sequential orchestration across SIGNALS → DETECTIONS → VERIFICATIONS → ROUTING → DISTRIBUTION
          </p>
        </div>

        <div className="flex items-center space-x-1 rounded border border-[#2E2E32] bg-[#0A0A0B] p-1 text-xs">
          {(["1h", "24h", "7d", "30d"] as const).map((rng) => (
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

      {/* 5 Sequential Pipeline Stages with Directional Arrows */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {stages.map((stg, idx) => {
          const isBottleneck = stg.isBottleneck;
          const itemsCount = Math.round(stg.itemsPerHour * multiplier);

          return (
            <div
              key={stg.stageId}
              className={`relative flex flex-col justify-between rounded-lg border p-4 transition-all ${
                isBottleneck
                  ? "border-amber-500 bg-amber-500/10 shadow-lg"
                  : "border-[#2E2E32] bg-[#12121A] hover:border-[#0066CC]"
              }`}
            >
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-[10px] font-bold text-[#3399FF] border border-[#2E2E32]">
                    STAGE #{idx + 1}
                  </span>
                  {isBottleneck && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 animate-pulse">
                      ⚠ BOTTLENECK
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#FAFAFA]">
                  {stg.label}
                </h4>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between border-b border-[#2E2E32] pb-1">
                  <span className="text-[#A0A4A8]">Throughput:</span>
                  <span className="font-bold text-[#FAFAFA]">
                    {itemsCount.toLocaleString()}{" "}
                    <span className="text-[10px] font-normal text-[#A0A4A8]">
                      items
                    </span>
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#2E2E32] pb-1">
                  <span className="text-[#A0A4A8]">Queue Depth:</span>
                  <span
                    className={`font-bold ${
                      isBottleneck ? "text-amber-400" : "text-[#0D9040]"
                    }`}
                  >
                    {stg.queueDepth.toLocaleString()} items
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A0A4A8]">Avg Process Time:</span>
                  <span className="font-bold text-[#3399FF]">
                    {stg.avgProcessingTimeMs}ms
                  </span>
                </div>
              </div>

              {/* Directional arrow between stages (on desktop) */}
              {idx < stages.length - 1 && (
                <div
                  aria-hidden="true"
                  className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 transform text-lg font-bold text-[#3399FF] lg:block"
                >
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ThroughputChart;
