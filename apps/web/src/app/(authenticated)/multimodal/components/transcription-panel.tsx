"use client";

import React, { useState } from "react";
import { SpeakerSegmentItem } from "../types";

export interface TranscriptionPanelProps {
  segments: SpeakerSegmentItem[];
  onSeekTimestamp?: (startMs: number) => void;
}

export function TranscriptionPanel({
  segments,
  onSeekTimestamp,
}: TranscriptionPanelProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredSegments = segments.filter((seg) => {
    return (
      searchQuery.trim() === "" ||
      seg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seg.speakerNameDisplay.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-4 rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
      {/* Top Header & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2E32] pb-3">
        <div>
          <h4 className="text-sm font-bold text-[#FAFAFA]">
            Speaker-Segmented Transcription Ledger (Whisper-1)
          </h4>
          <p className="text-xs text-[#A0A4A8]">
            Color-coded speaker diarization with interactive timestamps and sentiment attribution
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#A0A4A8]">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript or speaker..."
            className="w-64 rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
          />
        </div>
      </div>

      {/* Segment List */}
      {filteredSegments.length === 0 ? (
        <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-6 text-center text-xs text-[#A0A4A8]">
          No transcription segments match your current search query &ldquo;{searchQuery}&rdquo;.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSegments.map((seg) => {
            const confPct = Math.round(seg.confidence * 100);

            return (
              <div
                key={seg.id}
                style={{ borderLeftColor: seg.colorHex }}
                className="flex flex-col justify-between gap-3 rounded-lg border border-l-4 border-[#2E2E32] bg-[#0A0A0B] p-4 transition-colors hover:border-[#0066CC]/40 sm:flex-row sm:items-start"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      style={{
                        backgroundColor: `${seg.colorHex}20`,
                        color: seg.colorHex,
                        borderColor: `${seg.colorHex}40`,
                      }}
                      className="rounded border px-2 py-0.5 text-xs font-bold"
                    >
                      {seg.speakerNameDisplay}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSeekTimestamp && onSeekTimestamp(seg.startMs)}
                      className="rounded bg-[#2E2E32] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#3399FF] hover:bg-[#0066CC] hover:text-white transition-colors"
                      aria-label={`Seek audio to ${seg.timestampDisplay}`}
                    >
                      ▶ {seg.timestampDisplay}
                    </button>

                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        seg.sentiment === "POSITIVE"
                          ? "bg-[#0D9040]/20 text-[#0D9040]"
                          : seg.sentiment === "NEGATIVE"
                          ? "bg-[#CF2020]/20 text-[#CF2020]"
                          : "bg-[#6C5CE7]/20 text-[#6C5CE7]"
                      }`}
                    >
                      {seg.sentiment}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-[#FAFAFA]">
                    {seg.text}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="block font-mono text-xs font-bold text-[#0D9040]">
                    {confPct}%
                  </span>
                  <span className="text-[10px] text-[#A0A4A8]">Confidence</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
