"use client";

import React, { useState } from "react";
import { DetectedObjectItem } from "../types";

export interface ObjectDetectionListProps {
  objects: DetectedObjectItem[];
  selectedObjectId?: string | null;
  onSelectObject: (obj: DetectedObjectItem) => void;
}

export function ObjectDetectionList({
  objects,
  selectedObjectId,
  onSelectObject,
}: ObjectDetectionListProps): React.JSX.Element {
  const [sortBy, setSortBy] = useState<"confidence" | "label">("confidence");
  const [minConfidence, setMinConfidence] = useState<number>(0.5);

  const filteredObjects = objects
    .filter((obj) => obj.confidence >= minConfidence)
    .sort((a, b) => {
      if (sortBy === "confidence") {
        return b.confidence - a.confidence;
      }
      return a.label.localeCompare(b.label);
    });

  return (
    <div className="space-y-4 rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
      {/* Top Header & Sort/Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2E32] pb-3">
        <div>
          <h4 className="text-sm font-bold text-[#FAFAFA]">
            Detected Objects & Bounding Box Ledger (AGT-013)
          </h4>
          <p className="text-xs text-[#A0A4A8]">
            Click any row to highlight its bounding box on the media viewer
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs">
            <label className="text-[#A0A4A8]">Min Conf:</label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={Math.round(minConfidence * 100)}
              onChange={(e) =>
                setMinConfidence(parseInt(e.target.value, 10) / 100)
              }
              className="h-1.5 w-20 cursor-pointer appearance-none rounded-lg bg-[#2E2E32] accent-[#0066CC]"
            />
            <span className="font-mono text-[#FAFAFA]">
              {(minConfidence * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex items-center space-x-1 text-xs">
            <span className="text-[#A0A4A8]">Sort:</span>
            <button
              type="button"
              onClick={() => setSortBy("confidence")}
              className={`rounded px-2 py-1 font-semibold transition-colors ${
                sortBy === "confidence"
                  ? "bg-[#0066CC] text-white"
                  : "bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
              }`}
            >
              Confidence
            </button>
            <button
              type="button"
              onClick={() => setSortBy("label")}
              className={`rounded px-2 py-1 font-semibold transition-colors ${
                sortBy === "label"
                  ? "bg-[#0066CC] text-white"
                  : "bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
              }`}
            >
              Label
            </button>
          </div>
        </div>
      </div>

      {/* Object List Rows */}
      {filteredObjects.length === 0 ? (
        <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-6 text-center text-xs text-[#A0A4A8]">
          No detected objects meet the minimum confidence threshold of {(minConfidence * 100).toFixed(0)}%.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredObjects.map((obj) => {
            const isSelected = selectedObjectId === obj.id;
            const confPct = Math.round(obj.confidence * 100);

            return (
              <div
                key={obj.id}
                onClick={() => onSelectObject(obj)}
                style={{
                  borderLeftColor: obj.colorHex,
                }}
                className={`flex cursor-pointer items-center justify-between rounded-lg border border-l-4 p-3 transition-all ${
                  isSelected
                    ? "border-[#3399FF] bg-[#3399FF]/10 shadow-sm"
                    : "border-[#2E2E32] bg-[#0A0A0B] hover:border-[#0066CC]"
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      style={{ backgroundColor: obj.colorHex }}
                      className="h-2.5 w-2.5 rounded-full"
                    />
                    <h5 className="text-xs font-bold text-[#FAFAFA]">
                      {obj.label}
                    </h5>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-[#A0A4A8]">
                    bbox: [{obj.bbox.xMin.toFixed(2)}, {obj.bbox.yMin.toFixed(2)},{" "}
                    {obj.bbox.xMax.toFixed(2)}, {obj.bbox.yMax.toFixed(2)}]
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
