"use client";

import React from "react";
import { PredictiveModelItem, PredictiveModelStatus } from "../types";

export interface ModelCardProps {
  model: PredictiveModelItem;
  onPromote: (id: string) => void;
  onRetire: (id: string) => void;
}

function getStatusBadge(status: PredictiveModelStatus): {
  label: string;
  style: string;
} {
  switch (status) {
    case "ACTIVE":
      return {
        label: "ACTIVE",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-bold",
      };
    case "CANDIDATE":
      return {
        label: "CANDIDATE",
        style: "bg-[#3399FF]/20 text-[#3399FF] border border-[#3399FF]/40 font-semibold",
      };
    case "TRAINING":
      return {
        label: "TRAINING",
        style: "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold animate-pulse",
      };
    case "RETIRED":
    default:
      return {
        label: "RETIRED",
        style: "bg-[#2E2E32]/50 text-[#A0A4A8] border border-[#2E2E32]",
      };
  }
}

export function ModelCard({
  model,
  onPromote,
  onRetire,
}: ModelCardProps): React.JSX.Element {
  const badge = getStatusBadge(model.status);
  const accPct = (model.accuracyScore * 100).toFixed(1);
  const trendSign = model.accuracyTrendPct >= 0 ? "+" : "";

  return (
    <div className="flex flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow transition-all hover:border-[#0066CC]">
      <div>
        {/* Top Header: Engine Code & Status */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="rounded bg-[#0A0A0B] px-2.5 py-0.5 font-mono text-xs font-bold text-[#3399FF] border border-[#2E2E32]">
              {model.engineCode}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${badge.style}`}
            >
              ● {badge.label}
            </span>
          </div>
          <span className="font-mono text-xs text-[#A0A4A8]">
            v:{model.version}
          </span>
        </div>

        {/* Name */}
        <h3 className="mb-2 text-base font-bold text-[#FAFAFA]">
          {model.name}
        </h3>

        {/* Metrics Grid */}
        <div className="mb-4 grid grid-cols-2 gap-2 rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-xs">
          <div>
            <div className="text-[10px] text-[#A0A4A8]">Model Accuracy</div>
            <div className="font-bold text-[#0D9040]">
              {accPct}%{" "}
              <span className="text-[10px] font-normal text-[#3399FF]">
                ({trendSign}{model.accuracyTrendPct}%)
              </span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#A0A4A8]">Training Sample Set</div>
            <div className="font-bold text-[#FAFAFA]">
              {model.dataPointsUsed.toLocaleString()} pts
            </div>
          </div>
        </div>

        {/* Minimum Data Requirement Status */}
        <div className="mb-4 flex items-center justify-between rounded border border-[#2E2E32] bg-[#12121A] px-3 py-2 text-xs">
          <span className="text-[#A0A4A8]">Min Data Requirement (≥ 100 pts):</span>
          <span
            className={`font-bold ${
              model.minDataRequirementMet
                ? "text-[#0D9040]"
                : "text-amber-400"
            }`}
          >
            {model.minDataRequirementMet ? "✔ SATISFIED" : "⚠ INSUFFICIENT"}
          </span>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between border-t border-[#2E2E32] pt-3 text-xs">
        <span className="text-[11px] text-[#A0A4A8]">
          Trained {new Date(model.lastTrainedAt).toLocaleDateString()}
        </span>

        <div className="flex items-center space-x-2">
          {model.status !== "ACTIVE" && (
            <button
              type="button"
              onClick={() => onPromote(model.id)}
              disabled={!model.minDataRequirementMet}
              className="rounded bg-[#0D9040] px-3 py-1 font-semibold text-white hover:bg-[#0D9040]/80 disabled:opacity-40"
            >
              ✓ Promote to ACTIVE
            </button>
          )}
          {model.status !== "RETIRED" && (
            <button
              type="button"
              onClick={() => onRetire(model.id)}
              className="rounded border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1 font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
            >
              Retire Model
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModelCard;
