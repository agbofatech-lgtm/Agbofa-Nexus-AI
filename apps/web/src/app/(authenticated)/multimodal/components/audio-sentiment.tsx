"use client";

import React from "react";
import { AudioSentimentBreakdown, SpeakerSegmentItem } from "../types";

export interface AudioSentimentProps {
  sentiment: AudioSentimentBreakdown;
  segments: SpeakerSegmentItem[];
}

export function AudioSentiment({
  sentiment,
  segments,
}: AudioSentimentProps): React.JSX.Element {
  const confPct = Math.round(sentiment.confidenceScore * 100);

  // Group sentiment counts per speaker for breakdown
  const speakers = Array.from(new Set(segments.map((s) => s.speakerNameDisplay)));

  return (
    <div className="space-y-6 rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
      {/* Top Title & Overall Sentiment Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2E32] pb-3">
        <div>
          <h4 className="text-sm font-bold text-[#FAFAFA]">
            Audio Sentiment & Emotional Tone Ledger (AGT-013)
          </h4>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative sentiment classification across positive, neutral, and negative speech turns
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold border ${
              sentiment.overallSentiment === "POSITIVE"
                ? "bg-[#0D9040]/20 text-[#0D9040] border-[#0D9040]/40"
                : sentiment.overallSentiment === "NEGATIVE"
                ? "bg-[#CF2020]/20 text-[#CF2020] border-[#CF2020]/40"
                : "bg-[#6C5CE7]/20 text-[#6C5CE7] border-[#6C5CE7]/40"
            }`}
          >
            {sentiment.overallSentiment} TONE
          </span>

          <span className="rounded bg-[#0066CC]/20 px-2.5 py-1 text-xs font-mono font-bold text-[#3399FF] border border-[#0066CC]/40">
            {confPct}% Confidence
          </span>
        </div>
      </div>

      {/* 3 Sentiment Percentage Progress Bars */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#0D9040]/40 bg-[#0A0A0B] p-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-bold text-[#0D9040]">Positive Speech</span>
            <span className="font-mono text-sm font-bold text-[#FAFAFA]">
              {sentiment.positivePercentage}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#2E2E32]">
            <div
              className="h-2 rounded-full bg-[#0D9040]"
              style={{ width: `${sentiment.positivePercentage}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-[#6C5CE7]/40 bg-[#0A0A0B] p-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-bold text-[#6C5CE7]">Neutral Speech</span>
            <span className="font-mono text-sm font-bold text-[#FAFAFA]">
              {sentiment.neutralPercentage}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#2E2E32]">
            <div
              className="h-2 rounded-full bg-[#6C5CE7]"
              style={{ width: `${sentiment.neutralPercentage}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-[#CF2020]/40 bg-[#0A0A0B] p-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-bold text-[#CF2020]">Negative Speech</span>
            <span className="font-mono text-sm font-bold text-[#FAFAFA]">
              {sentiment.negativePercentage}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#2E2E32]">
            <div
              className="h-2 rounded-full bg-[#CF2020]"
              style={{ width: `${sentiment.negativePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Per-Speaker Sentiment Breakdown Table */}
      <div className="space-y-3 border-t border-[#2E2E32] pt-4">
        <h5 className="text-xs font-bold uppercase tracking-wide text-[#FAFAFA]">
          Per-Speaker Sentiment Breakdown
        </h5>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {speakers.map((spkName) => {
            const spkSegments = segments.filter(
              (s) => s.speakerNameDisplay === spkName,
            );
            const posCount = spkSegments.filter((s) => s.sentiment === "POSITIVE").length;
            const neuCount = spkSegments.filter((s) => s.sentiment === "NEUTRAL").length;
            const negCount = spkSegments.filter((s) => s.sentiment === "NEGATIVE").length;

            return (
              <div
                key={spkName}
                className="rounded-lg border border-[#2E2E32] bg-[#0A0A0B] p-3 text-xs"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold text-[#FAFAFA]">{spkName}</span>
                  <span className="text-[11px] text-[#A0A4A8]">
                    {spkSegments.length} turns
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="text-[#0D9040]">● {posCount} Pos</span>
                  <span className="text-[#6C5CE7]">● {neuCount} Neu</span>
                  <span className="text-[#CF2020]">● {negCount} Neg</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
