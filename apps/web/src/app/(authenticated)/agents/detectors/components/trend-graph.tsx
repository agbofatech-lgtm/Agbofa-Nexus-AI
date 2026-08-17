"use client";

import React from "react";
import { TrendStageCount, TrendVelocityPoint } from "../types";

export interface TrendGraphProps {
  stages: TrendStageCount[];
  velocitySeries: TrendVelocityPoint[];
}

function getStageColor(stage: string): { bg: string; text: string; border: string } {
  switch (stage) {
    case "PEAK":
      return {
        bg: "bg-[#CF2020]/10",
        text: "text-[#CF2020]",
        border: "border-[#CF2020]/50",
      };
    case "ACCELERATING":
      return {
        bg: "bg-[#0066CC]/10",
        text: "text-[#3399FF]",
        border: "border-[#0066CC]/50",
      };
    case "EMERGING":
      return {
        bg: "bg-[#0D9040]/10",
        text: "text-[#0D9040]",
        border: "border-[#0D9040]/50",
      };
    case "DECAY":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/50",
      };
    case "EVERGREEN":
    default:
      return {
        bg: "bg-[#6C5CE7]/10",
        text: "text-[#6C5CE7]",
        border: "border-[#6C5CE7]/50",
      };
  }
}

export function TrendGraph({
  stages,
  velocitySeries,
}: TrendGraphProps): React.JSX.Element {
  const maxVel = Math.max(...velocitySeries.map((v) => v.velocity), 1);

  return (
    <div className="space-y-6">
      {/* 5 Lifecycle Stages Bar (EMERGING -> ACCELERATING -> PEAK -> DECAY -> EVERGREEN) */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <div className="mb-4 flex items-center justify-between border-b border-[#2E2E32] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              Authoritative Trend Lifecycle Transitions
            </h3>
            <p className="text-xs text-[#A0A4A8]">
              Active signal trajectory across 5 authoritative stages
            </p>
          </div>
          <span className="rounded-full bg-[#0066CC]/20 px-3 py-1 text-xs font-bold text-[#3399FF]">
            {stages.reduce((acc, s) => acc + s.count, 0)} Active Trends
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {stages.map((stg, idx) => {
            const style = getStageColor(stg.stage);
            return (
              <div
                key={stg.stage}
                className={`relative flex flex-col justify-between rounded-lg border p-4 transition-all ${style.bg} ${style.border}`}
              >
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-[10px] font-bold text-[#FAFAFA] border border-[#2E2E32]">
                      STAGE #{idx + 1}
                    </span>
                    <span className={`text-xs font-bold ${style.text}`}>
                      ● {stg.stage}
                    </span>
                  </div>

                  <div className="mt-3 text-2xl font-bold text-[#FAFAFA]">
                    {stg.count} <span className="text-xs font-normal text-[#A0A4A8]">trends</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#2E2E32] pt-2 text-xs">
                  <span className="text-[#A0A4A8]">Velocity:</span>
                  <span className={`font-mono font-bold ${style.text}`}>
                    {stg.velocity} sig/hr
                  </span>
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

      {/* Trend Velocity Sparkline / Bar Chart */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
            24-Hour Trend Ingestion Velocity (Signals / Hour)
          </h3>
          <span className="text-xs font-mono text-[#3399FF]">
            Peak Velocity: {maxVel} sig/hr
          </span>
        </div>

        <div className="flex h-36 items-end justify-between gap-1.5 pt-4">
          {velocitySeries.map((d, i) => {
            const hPct = Math.max(12, Math.min(100, Math.round((d.velocity / maxVel) * 100)));
            return (
              <div
                key={i}
                className="flex flex-1 flex-col items-center justify-end space-y-1"
              >
                <div
                  className="w-full rounded-t bg-[#0066CC] transition-all hover:bg-[#3399FF]"
                  style={{ height: `${hPct}%` }}
                  title={`${d.hour}: ${d.velocity} signals/hour`}
                />
                <div className="text-[9px] text-[#A0A4A8]">{d.hour}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TrendGraph;
