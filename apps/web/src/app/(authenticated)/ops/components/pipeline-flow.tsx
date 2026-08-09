"use client";

import React from "react";
import { PipelineStageMetric, PipelineThroughputSummary } from "../types";

export interface PipelineFlowProps {
  stages: PipelineStageMetric[];
  summary: PipelineThroughputSummary;
}

function getHealthBadge(health: string): { label: string; style: string } {
  switch (health) {
    case "FLOWING":
      return {
        label: "FLOWING (OPTIMAL)",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-bold",
      };
    case "BOTTLENECKED":
      return {
        label: "BOTTLENECK DETECTED",
        style: "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold animate-pulse",
      };
    case "STALLED":
    default:
      return {
        label: "STALLED (CRITICAL)",
        style: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold animate-pulse",
      };
  }
}

export function PipelineFlow({
  stages,
  summary,
}: PipelineFlowProps): React.JSX.Element {
  const badge = getHealthBadge(summary.health);

  return (
    <div className="space-y-6">
      {/* Top Health & SLA Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Authoritative End-to-End Pipeline Health
          </span>
          <div className="mt-1 flex items-center space-x-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs ${badge.style}`}
            >
              ⚡ Status: {badge.label}
            </span>
            <span className="text-xs text-[#FAFAFA]">
              Avg End-to-End Latency:{" "}
              <span className="font-bold text-[#3399FF]">
                {summary.avgEndToEndLatencySeconds}s
              </span>{" "}
              (Signal → Publication)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-right text-xs">
          <div>
            <div className="text-[#A0A4A8]">Signals (24h)</div>
            <div className="text-base font-bold text-[#FAFAFA]">
              {summary.signalsDetected24h.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[#A0A4A8]">Verified (24h)</div>
            <div className="text-base font-bold text-[#6C5CE7]">
              {summary.storiesVerified24h.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[#A0A4A8]">Distributed (24h)</div>
            <div className="text-base font-bold text-[#0D9040]">
              {summary.packagesDistributed24h.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Stages Bar (5 stages with directional -> arrows) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {stages.map((stg, idx) => {
          const isBottleneck = stg.isBottleneck;
          return (
            <div
              key={stg.stageId}
              className={`relative flex flex-col justify-between rounded-lg border p-4 transition-all ${
                isBottleneck
                  ? "border-amber-500 bg-amber-500/10 shadow-lg"
                  : "border-[#2E2E32] bg-[#12121A] hover:border-[#0066CC]"
              }`}
            >
              {/* Stage Header */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-[10px] font-bold text-[#3399FF] border border-[#2E2E32]">
                    STAGE #{idx + 1}
                  </span>
                  {isBottleneck && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      ⚠ BOTTLENECK
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#FAFAFA]">
                  {stg.label}
                </h4>
              </div>

              {/* Technical Stage Telemetry Grid */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between border-b border-[#2E2E32] pb-1">
                  <span className="text-[#A0A4A8]">Throughput:</span>
                  <span className="font-bold text-[#FAFAFA]">
                    {stg.itemsPerHour.toLocaleString()}{" "}
                    <span className="text-[10px] font-normal text-[#A0A4A8]">
                      items/hr
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

export default PipelineFlow;
