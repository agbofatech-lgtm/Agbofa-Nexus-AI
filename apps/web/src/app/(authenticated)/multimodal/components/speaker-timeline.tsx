"use client";

import React, { useState } from "react";
import { SpeakerLegendItem, SpeakerSegmentItem } from "../types";

export interface SpeakerTimelineProps {
  legend: SpeakerLegendItem[];
  segments: SpeakerSegmentItem[];
  totalDurationSeconds: number;
  onSelectSegment?: (startMs: number) => void;
}

export function SpeakerTimeline({
  legend,
  segments,
  totalDurationSeconds,
  onSelectSegment,
}: SpeakerTimelineProps): React.JSX.Element {
  const [hoveredSegment, setHoveredSegment] = useState<SpeakerSegmentItem | null>(null);

  const totalMs = totalDurationSeconds * 1000 || 60000;

  return (
    <div className="space-y-4 rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2E2E32] pb-2">
        <div>
          <h4 className="text-sm font-bold text-[#FAFAFA]">
            Speaker Diarization Timeline (AGT-013 Audio Analyzer)
          </h4>
          <p className="text-xs text-[#A0A4A8]">
            Color-coded speaking turns across the {totalDurationSeconds}-second audio clip
          </p>
        </div>
        <span className="rounded-full bg-[#0D9040]/20 px-2.5 py-0.5 text-xs font-semibold text-[#0D9040] border border-[#0D9040]/40">
          {legend.length} Distinct Speakers
        </span>
      </div>

      {/* Visual Horizontal Timeline Bar */}
      <div className="space-y-2">
        <div className="relative flex h-8 w-full overflow-hidden rounded-md border border-[#2E2E32] bg-[#0A0A0B]">
          {segments.map((seg) => {
            const leftPct = (seg.startMs / totalMs) * 100;
            const widthPct = ((seg.endMs - seg.startMs) / totalMs) * 100;

            return (
              <div
                key={seg.id}
                onMouseEnter={() => setHoveredSegment(seg)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => onSelectSegment && onSelectSegment(seg.startMs)}
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: seg.colorHex,
                }}
                className="absolute top-0 h-full cursor-pointer transition-opacity hover:opacity-80 border-r border-black/30"
                aria-label={`${seg.speakerNameDisplay}: ${seg.timestampDisplay}`}
              />
            );
          })}
        </div>

        {/* Hover Text Preview Alert */}
        <div className="min-h-[2.5rem] rounded border border-[#2E2E32] bg-[#0A0A0B] p-2 text-xs">
          {hoveredSegment ? (
            <div className="flex items-center justify-between">
              <div>
                <span
                  style={{ color: hoveredSegment.colorHex }}
                  className="font-bold"
                >
                  {hoveredSegment.speakerNameDisplay}
                </span>{" "}
                <span className="font-mono text-[#A0A4A8]">
                  ({hoveredSegment.timestampDisplay}):
                </span>{" "}
                <span className="text-[#FAFAFA]">
                  &ldquo;{hoveredSegment.text}&rdquo;
                </span>
              </div>
              <span className="ml-2 font-mono text-[10px] text-[#0D9040]">
                ▶ Click to seek
              </span>
            </div>
          ) : (
            <span className="text-[#A0A4A8]">
              Hover over any timeline segment to preview speaker statement and timestamp...
            </span>
          )}
        </div>
      </div>

      {/* Speaker Legend Table/Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {legend.map((spk) => (
          <div
            key={spk.speakerId}
            style={{ borderLeftColor: spk.colorHex }}
            className="flex items-center justify-between rounded-lg border border-l-4 border-[#2E2E32] bg-[#0A0A0B] p-3"
          >
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span
                  style={{ backgroundColor: spk.colorHex }}
                  className="h-2.5 w-2.5 rounded-full"
                />
                <h5 className="text-xs font-bold text-[#FAFAFA]">
                  {spk.name}
                </h5>
              </div>
              <p className="text-[11px] text-[#A0A4A8]">
                {spk.segmentCount} speaking turns
              </p>
            </div>
            <div className="text-right">
              <span
                style={{ color: spk.colorHex }}
                className="block font-mono text-base font-bold"
              >
                {spk.speakingTimePercentage}%
              </span>
              <span className="text-[10px] text-[#A0A4A8]">Airtime</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
