"use client";

import React from "react";
import { BiasClassificationData } from "../types";

export interface BiasChartProps {
  classifications: BiasClassificationData;
  totalAnalyses: number;
  selfAwarenessActive?: boolean;
}

export function BiasChart({
  classifications,
  totalAnalyses,
  selfAwarenessActive = true,
}: BiasChartProps): React.JSX.Element {
  const total = Math.max(
    totalAnalyses,
    classifications.none +
      classifications.political +
      classifications.commercial +
      classifications.cultural +
      classifications.selection,
    1,
  );

  const bars = [
    {
      label: "NONE (Objective / Neutral Reporting)",
      count: classifications.none,
      color: "bg-[#0D9040]",
      textColor: "text-[#0D9040]",
    },
    {
      label: "POLITICAL BIAS",
      count: classifications.political,
      color: "bg-[#CF2020]",
      textColor: "text-[#CF2020]",
    },
    {
      label: "COMMERCIAL PROMOTION BIAS",
      count: classifications.commercial,
      color: "bg-amber-500",
      textColor: "text-amber-400",
    },
    {
      label: "CULTURAL / SOCIAL FRAMING BIAS",
      count: classifications.cultural,
      color: "bg-[#6C5CE7]",
      textColor: "text-[#6C5CE7]",
    },
    {
      label: "SELECTION / OMISSION BIAS",
      count: classifications.selection,
      color: "bg-[#3399FF]",
      textColor: "text-[#3399FF]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar with Self-Awareness & Total */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2E32] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              Editorial Bias Classification Distribution ({total.toLocaleString()} analyses)
            </h3>
            <p className="text-xs text-[#A0A4A8]">
              AGT-022 multi-axis bias classification across content submissions
            </p>
          </div>
          {selfAwarenessActive && (
            <span className="inline-flex items-center rounded-full bg-[#6C5CE7]/20 px-3 py-1 text-xs font-bold text-[#6C5CE7] border border-[#6C5CE7]/40">
              ⚡ Self-awareness: ACTIVE — this agent monitors its own potential bias
            </span>
          )}
        </div>

        {/* Horizontal bar chart */}
        <div className="space-y-3">
          {bars.map((bar) => {
            const pct = Math.round((bar.count / total) * 100);
            return (
              <div key={bar.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#FAFAFA]">{bar.label}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#A0A4A8]">
                      {bar.count.toLocaleString()}
                    </span>
                    <span className={`font-mono font-bold ${bar.textColor}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
                  <div
                    className={`h-full ${bar.color} transition-all`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Truth Independence Notice Card */}
      <div className="rounded-lg border border-[#6C5CE7]/40 bg-[#6C5CE7]/10 p-4">
        <div className="flex items-center space-x-2">
          <span className="text-base font-bold text-[#6C5CE7]">⚖</span>
          <span className="text-xs font-bold text-[#FAFAFA]">
            Authoritative Truth Independence Notice:
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[#FAFAFA]">
          Bias detection does not determine truth. Biased content can be factually true. AGT-022 bias scores contribute an inverted 10% weight to the composite confidence score without overriding AGT-017 factual verdicts.
        </p>
      </div>
    </div>
  );
}

export default BiasChart;
