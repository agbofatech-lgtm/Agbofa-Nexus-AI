"use client";

import React from "react";
import { KeyFrameItem } from "../types";

export interface KeyFrameStripProps {
  keyFrames: KeyFrameItem[];
  selectedFrameId: string;
  onSelectFrame: (frameId: string) => void;
}

export function KeyFrameStrip({
  keyFrames,
  selectedFrameId,
  onSelectFrame,
}: KeyFrameStripProps): React.JSX.Element {
  return (
    <div className="space-y-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2E2E32] pb-2">
        <div>
          <h4 className="text-sm font-bold text-[#FAFAFA]">
            Extracted Key Frame Strip (AGT-013 Video Analyzer)
          </h4>
          <p className="text-xs text-[#A0A4A8]">
            Horizontal scrollable strip of key frames with scene detection (Capped at 5 frames per video for quota management)
          </p>
        </div>
        <span className="rounded-full bg-[#0066CC]/20 px-2.5 py-0.5 text-xs font-semibold text-[#3399FF] border border-[#0066CC]/40">
          ⚡ {keyFrames.length} / 5 Key Frames Extracted (100% Capped)
        </span>
      </div>

      {/* Horizontal Scrollable Grid/Strip */}
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#2E2E32]">
        {keyFrames.map((frame) => {
          const isSelected = selectedFrameId === frame.id;
          return (
            <div
              key={frame.id}
              onClick={() => onSelectFrame(frame.id)}
              className={`group relative w-48 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-[#3399FF] bg-[#3399FF]/10 shadow-lg"
                  : "border-[#2E2E32] bg-[#0A0A0B] hover:border-[#0066CC]"
              }`}
            >
              <div className="relative aspect-video w-full bg-[#12121A]">
                <img
                  src={frame.frameUrl}
                  alt={frame.sceneDescription}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute bottom-1 left-1 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#FAFAFA]">
                  {frame.timestampDisplay}
                </div>
                <div className="absolute right-1 top-1 rounded bg-[#0066CC]/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                  Frame #{frame.frameNumber}
                </div>
              </div>

              <div className="p-2.5">
                <p className="line-clamp-2 text-[11px] font-medium leading-tight text-[#FAFAFA]">
                  {frame.sceneDescription}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-[#A0A4A8]">
                  <span>{frame.detectedObjects.length} objects</span>
                  <span
                    className={`font-semibold ${
                      isSelected ? "text-[#3399FF]" : "text-[#A0A4A8]"
                    }`}
                  >
                    {isSelected ? "Active View" : "Click to view"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
