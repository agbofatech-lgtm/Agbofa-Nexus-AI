"use client";

import React, { useState } from "react";
import {
  OptimizationSuggestionItem,
  OptimizationSuggestionType,
} from "../types";

export interface OptimizerSuggestionsProps {
  suggestions: OptimizationSuggestionItem[];
  onApplySuggestion?: (id: string) => void;
}

function getTypeBadge(type: OptimizationSuggestionType): {
  label: string;
  style: string;
} {
  switch (type) {
    case "HEADLINE":
      return {
        label: "HEADLINE OPTIMIZATION",
        style: "bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/40",
      };
    case "MEDIA":
      return {
        label: "MEDIA ASSET ENHANCEMENT",
        style: "bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/40",
      };
    case "KEYWORDS":
      return {
        label: "SEO KEYWORDS & ENTITIES",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40",
      };
    case "LENGTH":
    default:
      return {
        label: "PROSE LENGTH & PACING",
        style: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
      };
  }
}

export function OptimizerSuggestions({
  suggestions,
  onApplySuggestion,
}: OptimizerSuggestionsProps): React.JSX.Element {
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  const handleApply = (id: string) => {
    setAppliedIds((prev) => [...prev, id]);
    if (onApplySuggestion) {
      onApplySuggestion(id);
    } else {
      alert(`Optimization suggestion '${id}' applied to draft package.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Authoritative Policy Card */}
      <div className="rounded-lg border-2 border-[#0066CC] bg-[#0066CC]/10 p-5 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-[#3399FF]">⚡</span>
          <h4 className="text-sm font-bold tracking-wide text-[#FAFAFA]">
            AUTHORITATIVE EDITORIAL SOVEREIGNTY POLICY (PRED-003)
          </h4>
        </div>
        <p className="mt-2 font-mono text-xs font-bold uppercase tracking-wider text-[#3399FF]">
          RECOMMENDATIONS ONLY — NEVER MODIFIES CONTENT
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#FAFAFA]">
          PRED-003 Content Performance Optimizer evaluates headlines, media assets, SEO keywords, and prose length against empirical engagement ledgers. The predictive engine provides non-destructive suggestions only; editorial modifications remain strictly under human control.
        </p>
      </div>

      {/* Ordered Suggestions List */}
      <div className="space-y-4">
        {suggestions.map((item, idx) => {
          const badge = getTypeBadge(item.type);
          const isApplied = appliedIds.includes(item.id);

          return (
            <div
              key={item.id}
              className={`rounded-lg border p-4 transition-all ${
                isApplied
                  ? "border-[#0D9040]/60 bg-[#0D9040]/10 opacity-80"
                  : "border-[#2E2E32] bg-[#12121A] hover:border-[#0066CC]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2E2E32] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-xs font-bold text-[#FAFAFA] border border-[#2E2E32]">
                    #{idx + 1}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.style}`}
                  >
                    {badge.label}
                  </span>
                  <span className="text-xs font-semibold text-[#FAFAFA]">
                    Story: {item.storyId}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="rounded bg-[#0D9040]/20 px-2.5 py-0.5 text-xs font-bold text-[#0D9040] border border-[#0D9040]/30">
                    ▲ +{item.expectedLiftPct}% Expected Lift
                  </span>
                  {!isApplied ? (
                    <button
                      type="button"
                      onClick={() => handleApply(item.id)}
                      className="rounded bg-[#0066CC] px-3.5 py-1 text-xs font-semibold text-white hover:bg-[#3399FF]"
                    >
                      Apply Suggestion →
                    </button>
                  ) : (
                    <span className="rounded bg-[#0D9040] px-3 py-1 text-xs font-bold text-white">
                      ✔ APPLIED
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <h4 className="text-sm font-bold text-[#FAFAFA]">
                  {item.title}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-[#FAFAFA]">
                  {item.suggestionText}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[#2E2E32] pt-2 text-[11px] text-[#A0A4A8]">
                <span>Suggestion ID: {item.id}</span>
                <div className="flex items-center space-x-3 font-mono">
                  <span>Current Score: <strong className="text-[#FAFAFA]">{(item.currentScore * 100).toFixed(0)}%</strong></span>
                  <span>→</span>
                  <span>Projected Score: <strong className="text-[#0D9040]">{(item.projectedScore * 100).toFixed(0)}%</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OptimizerSuggestions;
