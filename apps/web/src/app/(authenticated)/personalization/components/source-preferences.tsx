"use client";

import React from "react";
import { SourcePreferenceItem, SourceTrustTier } from "../types";

export interface SourcePreferencesProps {
  sources: SourcePreferenceItem[];
  onChangePreferenceScore: (sourceId: string, newScore: number) => void;
  onChangeTrustRating: (sourceId: string, newRating: SourceTrustTier) => void;
}

const TRUST_RATINGS: { value: SourceTrustTier; label: string; badgeColor: string }[] = [
  { value: "HIGH_TRUST", label: "High Trust ★★★★★", badgeColor: "bg-[#0D9040]/20 text-[#0D9040] border-[#0D9040]/30" },
  { value: "VERIFIED", label: "Verified ★★★★☆", badgeColor: "bg-[#0066CC]/20 text-[#3399FF] border-[#0066CC]/30" },
  { value: "NEUTRAL", label: "Neutral ★★★☆☆", badgeColor: "bg-[#6C5CE7]/20 text-[#6C5CE7] border-[#6C5CE7]/30" },
  { value: "RESTRICTED", label: "Restricted ★★☆☆☆", badgeColor: "bg-[#CF2020]/20 text-[#CF2020] border-[#CF2020]/30" },
];

export function SourcePreferences({
  sources,
  onChangePreferenceScore,
  onChangeTrustRating,
}: SourcePreferencesProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#2E2E32] pb-3">
        <div>
          <h3 className="text-base font-bold text-[#FAFAFA]">
            Source Preferences & Trust Ledger (PERS-002)
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            Assign preference weightings (10% of feed score) and trust ratings across social platforms and news wires
          </p>
        </div>
        <span className="rounded-full bg-[#0D9040]/10 px-3 py-1 text-xs font-semibold text-[#0D9040] border border-[#0D9040]/30">
          {sources.length} Monitored Sources
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((src) => {
          const prefPct = Math.round(src.preferenceScore * 100);
          const currentTrust =
            TRUST_RATINGS.find((t) => t.value === src.trustRating) || TRUST_RATINGS[1];

          return (
            <div
              key={src.id}
              className="flex flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 transition-colors hover:border-[#0066CC]/40"
            >
              <div>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#FAFAFA]">
                      {src.sourceName}
                    </h4>
                    <span className="text-[11px] font-mono text-[#A0A4A8]">
                      Platform: {src.platform}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${currentTrust.badgeColor}`}
                  >
                    {src.trustScoreDisplay}
                  </span>
                </div>

                <div className="mb-3 flex items-center justify-between text-xs text-[#A0A4A8]">
                  <span>{src.articlesRead} articles read</span>
                  <span
                    className={`text-[11px] font-medium ${
                      src.isExplicitlyPreferred
                        ? "text-[#3399FF]"
                        : "text-[#A0A4A8]"
                    }`}
                  >
                    {src.isExplicitlyPreferred
                      ? "Explicit Preferred Source"
                      : "Standard Weighting"}
                  </span>
                </div>
              </div>

              {/* Trust Tier Select */}
              <div className="mt-2 space-y-3 border-t border-[#2E2E32] pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#A0A4A8]">Trust Policy</span>
                  <select
                    value={src.trustRating}
                    onChange={(e) =>
                      onChangeTrustRating(src.id, e.target.value as SourceTrustTier)
                    }
                    className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC] focus:outline-none"
                    aria-label={`Select trust rating for ${src.sourceName}`}
                  >
                    {TRUST_RATINGS.map((tr) => (
                      <option key={tr.value} value={tr.value}>
                        {tr.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preference Slider Control */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#A0A4A8]">Preference Weight</span>
                    <span className="font-mono text-[#FAFAFA]">{prefPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={prefPct}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onChangePreferenceScore(src.id, val / 100);
                    }}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#2E2E32] accent-[#0066CC]"
                    aria-label={`Preference slider for ${src.sourceName}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
