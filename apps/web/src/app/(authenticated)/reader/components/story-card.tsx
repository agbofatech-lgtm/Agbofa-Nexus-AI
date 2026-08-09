"use client";

import React from "react";
import { StoryCardData } from "../types";

export interface StoryCardProps {
  story: StoryCardData;
  onPress: () => void;
}

function getPlatformIcon(platform: string): string {
  const normalized = platform.toLowerCase();
  if (normalized.includes("twitter") || normalized.includes("x")) return "𝕏";
  if (normalized.includes("linkedin")) return "in";
  if (normalized.includes("facebook")) return "f";
  if (normalized.includes("instagram")) return "IG";
  if (normalized.includes("tiktok")) return "TT";
  if (normalized.includes("youtube")) return "▶";
  if (normalized.includes("reddit")) return "r/";
  if (normalized.includes("rss") || normalized.includes("wire")) return "📰";
  return "⚡";
}

function getConfidenceStyle(tier: string, score: number): string {
  if (tier === "DOUBTFUL" || score < 0.7) {
    return "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/30";
  }
  if (tier === "PROVISIONAL" || score < 0.9) {
    return "bg-[#3399FF]/20 text-[#3399FF] border border-[#3399FF]/30";
  }
  return "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/30";
}

export function StoryCard({ story, onPress }: StoryCardProps): React.JSX.Element {
  const percentage = Math.round(story.confidenceScore * 100);

  return (
    <article
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPress();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Story card: ${story.title}`}
      className="group flex flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow transition-all hover:border-[#0066CC] hover:shadow-lg cursor-pointer"
    >
      <div>
        {/* Top bar: Source Badge & Confidence Badge */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-[#0066CC]/20 px-2.5 py-0.5 text-xs font-semibold text-[#3399FF]">
            <span className="mr-1.5 font-bold" aria-hidden="true">
              {getPlatformIcon(story.sourcePlatform)}
            </span>
            {story.sourceName}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${getConfidenceStyle(story.confidenceTier, story.confidenceScore)}`}
          >
            {percentage}% · {story.confidenceTier.replace("_", " ")}
          </span>
        </div>

        {/* Headline */}
        <h2 className="mb-2 text-base font-bold text-[#FAFAFA] transition-colors group-hover:text-[#3399FF]">
          {story.title}
        </h2>

        {/* Summary (2-line clamp) */}
        <p className="line-clamp-2 text-xs leading-relaxed text-[#A0A4A8]">
          {story.summary}
        </p>
      </div>

      {/* Bottom bar: Status badge, Read time, & Read CTA */}
      <div className="mt-6 flex items-center justify-between border-t border-[#2E2E32] pt-4">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center text-xs font-medium text-[#6C5CE7]">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-[#6C5CE7]" />
            {story.status}
          </span>
          <span className="text-xs text-[#A0A4A8]">
            {story.readTimeMinutes} min read
          </span>
        </div>
        <span className="inline-flex items-center rounded-md bg-[#0066CC] px-3 py-1 text-xs font-semibold text-[#FAFAFA] transition-colors group-hover:bg-[#3399FF]">
          Read Story →
        </span>
      </div>
    </article>
  );
}

export default StoryCard;
