"use client";

import React from "react";
import { RecommendationExplanationItem } from "../types";

export interface RecommendationExplanationProps {
  items: RecommendationExplanationItem[];
}

export function RecommendationExplanation({
  items,
}: RecommendationExplanationProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Zero Fabrication Policy Banner */}
      <div
        role="region"
        aria-label="Zero Fabrication Guarantee"
        className="flex items-start justify-between rounded-lg border border-[#0D9040]/40 bg-[#0D9040]/10 p-4"
      >
        <div className="flex items-start space-x-3">
          <span className="text-lg">🛡️</span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#0D9040]">
              Zero Fabrication Guarantee & Anti-Echo-Chamber Policy (IMP-019 / PERS-003)
            </h4>
            <p className="mt-0.5 text-xs text-[#FAFAFA]">
              Never fabricated — based on your actual reading history.
            </p>
            <p className="mt-1 text-[11px] text-[#A0A4A8]">
              When your profile lacks a previously read story title, the engine never fabricates a reason,
              preserving the authentic underlying strategy reason (&ldquo;Personalized recommendation from reading history preferences&rdquo;).
              Diversity enforcement prevents echo chambers by discounting items when a single topic or source appears &ge;2 times.
            </p>
          </div>
        </div>
      </div>

      {/* 5-Factor Ranking Formula Legend */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#3399FF]">
          Authoritative 5-Factor Feed Ranking Formula (PERS-002)
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
          <div className="rounded border border-[#0066CC]/30 bg-[#0A0A0B] p-2 text-center">
            <span className="block font-bold text-[#FAFAFA]">35%</span>
            <span className="text-[11px] text-[#A0A4A8]">Topic Relevance</span>
          </div>
          <div className="rounded border border-[#0066CC]/30 bg-[#0A0A0B] p-2 text-center">
            <span className="block font-bold text-[#FAFAFA]">25%</span>
            <span className="text-[11px] text-[#A0A4A8]">Content Quality (AGT-024)</span>
          </div>
          <div className="rounded border border-[#0066CC]/30 bg-[#0A0A0B] p-2 text-center">
            <span className="block font-bold text-[#FAFAFA]">20%</span>
            <span className="text-[11px] text-[#A0A4A8]">Freshness</span>
          </div>
          <div className="rounded border border-[#0066CC]/30 bg-[#0A0A0B] p-2 text-center">
            <span className="block font-bold text-[#FAFAFA]">10%</span>
            <span className="text-[11px] text-[#A0A4A8]">Source Pref</span>
          </div>
          <div className="rounded border border-[#0066CC]/30 bg-[#0A0A0B] p-2 text-center">
            <span className="block font-bold text-[#FAFAFA]">10%</span>
            <span className="text-[11px] text-[#A0A4A8]">Diversity Score</span>
          </div>
        </div>
      </div>

      {/* Recommendation Items with "Because you read X" explanation */}
      <div className="space-y-4">
        {items.map((item) => {
          const finalScorePct = Math.round(item.relevanceScore * 100);

          return (
            <div
              key={item.id}
              className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 transition-colors hover:border-[#0066CC]/40"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF] border border-[#0066CC]/30">
                      {item.topicCategory}
                    </span>
                    <span className="text-xs font-semibold text-[#A0A4A8]">
                      Source: <span className="text-[#FAFAFA]">{item.sourceName}</span>
                    </span>
                    {item.diversityDiscountApplied && (
                      <span className="rounded bg-[#F59E0B]/20 px-2 py-0.5 text-[10px] font-bold text-[#F59E0B] border border-[#F59E0B]/30">
                        ⚡ Anti-Echo-Chamber Diversity Discount (0.75x)
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#FAFAFA]">
                    {item.title}
                  </h3>

                  {/* Evidence explanation block */}
                  <div className="rounded-md border border-[#0066CC]/30 bg-[#0A0A0B]/80 p-3">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-[#3399FF]">
                      <span>💡 Why this story was recommended:</span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-[#FAFAFA]">
                      &ldquo;{item.explanationReason}&rdquo;
                    </p>
                    {item.triggerArticleTitle && (
                      <p className="mt-1 text-[11px] text-[#A0A4A8]">
                        Trigger Evidence: Based on your reading of{" "}
                        <strong className="text-[#FAFAFA]">
                          &ldquo;{item.triggerArticleTitle}&rdquo;
                        </strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column: Relevance Breakdown */}
                <div className="w-full sm:w-64 shrink-0 rounded-lg border border-[#2E2E32] bg-[#0A0A0B] p-3 text-xs">
                  <div className="mb-2 flex items-center justify-between border-b border-[#2E2E32] pb-2 font-bold">
                    <span className="text-[#A0A4A8]">Clamped Score</span>
                    <span className="font-mono text-sm text-[#0D9040]">
                      {finalScorePct}% ({item.relevanceScore.toFixed(2)})
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-[#A0A4A8]">
                    <div className="flex justify-between">
                      <span>Topic (35%):</span>
                      <span className="font-mono text-[#FAFAFA]">
                        {(item.topicRelevanceScore * 0.35).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality (25% • AGT-024):</span>
                      <span className="font-mono text-[#FAFAFA]">
                        {(item.qualityScore * 0.25).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Freshness (20%):</span>
                      <span className="font-mono text-[#FAFAFA]">
                        {(item.freshnessScore * 0.20).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Source Pref (10%):</span>
                      <span className="font-mono text-[#FAFAFA]">
                        {(item.sourcePreferenceScore * 0.10).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diversity (10%):</span>
                      <span className="font-mono text-[#FAFAFA]">
                        {(item.diversityScore * 0.10).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
