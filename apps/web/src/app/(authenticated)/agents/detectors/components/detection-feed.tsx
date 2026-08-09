"use client";

import React, { useState } from "react";
import { DetectionResultItem } from "../types";

export interface DetectionFeedProps {
  detections: DetectionResultItem[];
  isLoading: boolean;
  filterTypes?: string[];
}

function getConfidenceColor(score: number): string {
  if (score >= 0.9) return "text-[#0D9040] bg-[#0D9040]/10 border-[#0D9040]/30";
  if (score >= 0.7) return "text-[#3399FF] bg-[#3399FF]/10 border-[#3399FF]/30";
  return "text-[#CF2020] bg-[#CF2020]/10 border-[#CF2020]/30";
}

export function DetectionFeed({
  detections,
  isLoading,
  filterTypes = ["ALL"],
}: DetectionFeedProps): React.JSX.Element {
  const [selectedBadge, setSelectedBadge] = useState<string>("ALL");
  const [activeDetail, setActiveDetail] = useState<DetectionResultItem | null>(null);

  const availableBadges = [
    "ALL",
    ...Array.from(new Set(detections.map((d) => d.typeBadge))),
  ];

  const filteredDetections = detections.filter((det) => {
    if (selectedBadge !== "ALL" && det.typeBadge !== selectedBadge) {
      return false;
    }
    return true;
  });

  return (
    <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
      {/* Header & Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2E32] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#FAFAFA]">
            Recent Intelligence Detections ({filteredDetections.length} items)
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            Real-time extracted entities, classifications, and verification signatures
          </p>
        </div>

        {/* Badge Filter */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#A0A4A8]">Filter:</span>
          {availableBadges.map((badge) => (
            <button
              key={badge}
              type="button"
              onClick={() => setSelectedBadge(badge)}
              className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                selectedBadge === badge
                  ? "bg-[#0066CC] text-white"
                  : "bg-[#0A0A0B] text-[#A0A4A8] border border-[#2E2E32] hover:text-[#FAFAFA]"
              }`}
            >
              {badge}
            </button>
          ))}
        </div>
      </div>

      {/* Scrolling Detection Feed */}
      <div
        className="max-h-[380px] space-y-2.5 overflow-y-auto pr-1"
        role="log"
        aria-label="Detection results stream"
      >
        {isLoading ? (
          <div className="py-8 text-center text-xs text-[#A0A4A8]">
            Loading detection stream telemetry...
          </div>
        ) : filteredDetections.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#A0A4A8]">
            Zero detection results match your selected filter.
          </div>
        ) : (
          filteredDetections.map((det) => {
            const confColor = getConfidenceColor(det.confidenceScore);
            return (
              <div
                key={det.id}
                onClick={() => setActiveDetail(det)}
                className="group cursor-pointer rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 transition-all hover:border-[#0066CC]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="rounded bg-[#12121A] px-2 py-0.5 font-mono text-xs font-bold text-[#3399FF] border border-[#2E2E32]">
                      {det.typeBadge}
                    </span>
                    {det.priority && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          det.priority === "C1"
                            ? "bg-[#CF2020] text-white"
                            : det.priority === "C2"
                            ? "bg-amber-500 text-black"
                            : "bg-[#2E2E32] text-[#FAFAFA]"
                        }`}
                      >
                        {det.priority}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold border ${confColor}`}
                    >
                      {(det.confidenceScore * 100).toFixed(0)}% Confidence
                    </span>
                    <span className="text-[11px] text-[#A0A4A8]">
                      {new Date(det.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <h4 className="mt-2 text-sm font-bold text-[#FAFAFA] group-hover:text-[#3399FF]">
                  {det.title}
                </h4>
                <p className="mt-1 line-clamp-2 text-xs text-[#A0A4A8]">
                  {det.contentPreview}
                </p>

                {det.metadata && (
                  <div className="mt-2 flex flex-wrap gap-2 border-t border-[#2E2E32] pt-2 text-[10px] text-[#A0A4A8]">
                    {Object.entries(det.metadata).map(([k, v]) => (
                      <span key={k} className="rounded bg-[#12121A] px-1.5 py-0.5">
                        {k}: <strong className="text-[#FAFAFA]">{String(v)}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {activeDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-lg rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2E2E32] pb-3">
              <div>
                <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-xs font-bold text-[#3399FF] border border-[#2E2E32]">
                  {activeDetail.id}
                </span>
                <span className="ml-2 rounded bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF]">
                  {activeDetail.typeBadge}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetail(null)}
                className="text-xs text-[#A0A4A8] hover:text-[#FAFAFA]"
              >
                ✕ Close
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <h3 className="text-base font-bold text-[#FAFAFA]">
                {activeDetail.title}
              </h3>
              <p className="leading-relaxed text-[#FAFAFA]">
                {activeDetail.contentPreview}
              </p>
              <div className="grid grid-cols-2 gap-2 rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-[#A0A4A8]">
                <div>
                  Agent ID: <strong className="text-[#FAFAFA]">{activeDetail.agentId}</strong>
                </div>
                <div>
                  Confidence:{" "}
                  <strong className="text-[#0D9040]">
                    {(activeDetail.confidenceScore * 100).toFixed(0)}%
                  </strong>
                </div>
                <div>
                  Detected:{" "}
                  <strong className="text-[#FAFAFA]">
                    {new Date(activeDetail.detectedAt).toLocaleString()}
                  </strong>
                </div>
                {activeDetail.priority && (
                  <div>
                    Priority: <strong className="text-[#CF2020]">{activeDetail.priority}</strong>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2 border-t border-[#2E2E32] pt-4">
              <button
                type="button"
                onClick={() => setActiveDetail(null)}
                className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-4 py-1.5 text-xs font-medium text-[#FAFAFA]"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetectionFeed;
