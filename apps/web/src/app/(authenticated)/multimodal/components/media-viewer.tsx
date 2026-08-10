"use client";

import React, { useState } from "react";
import { ImageAnalysisItem, DetectedObjectItem } from "../types";

export interface MediaViewerProps {
  analysis: ImageAnalysisItem;
  onSelectObject?: (obj: DetectedObjectItem) => void;
  selectedObjectId?: string | null;
}

export function MediaViewer({
  analysis,
  onSelectObject,
  selectedObjectId,
}: MediaViewerProps): React.JSX.Element {
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [showOcrText, setShowOcrText] = useState<boolean>(true);

  return (
    <div className="space-y-6">
      {/* Top Controls & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2E32] pb-3">
        <div>
          <h3 className="text-base font-bold text-[#FAFAFA]">
            Multimodal Media Viewer & Detection Overlay (AGT-013 / GPT-4V)
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            Interactive bounding box overlay, OCR text extraction panel, and visual sentiment classification
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowOverlays(!showOverlays)}
            className={`rounded border px-3 py-1.5 text-xs font-semibold transition-colors ${
              showOverlays
                ? "border-[#0066CC] bg-[#0066CC] text-white"
                : "border-[#2E2E32] bg-[#12121A] text-[#A0A4A8] hover:text-[#FAFAFA]"
            }`}
          >
            {showOverlays ? "👁️ Hide Bounding Boxes" : "👁️ Show Bounding Boxes"}
          </button>

          <button
            type="button"
            onClick={() => setShowOcrText(!showOcrText)}
            className={`rounded border px-3 py-1.5 text-xs font-semibold transition-colors ${
              showOcrText
                ? "border-[#0D9040] bg-[#0D9040] text-white"
                : "border-[#2E2E32] bg-[#12121A] text-[#A0A4A8] hover:text-[#FAFAFA]"
            }`}
          >
            {showOcrText ? "📄 Hide OCR Panel" : "📄 Show OCR Panel"}
          </button>
        </div>
      </div>

      {/* Main Grid: Image Viewer + OCR Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Image Display Area with Bounding Box Overlays */}
        <div className="relative overflow-hidden rounded-lg border border-[#2E2E32] bg-[#0A0A0B] lg:col-span-2">
          <div className="relative aspect-video w-full bg-[#12121A]">
            <img
              src={analysis.mediaUrl}
              alt={analysis.title}
              className="h-full w-full object-cover"
            />

            {/* Bounding Box Overlays */}
            {showOverlays &&
              analysis.detectedObjects.map((obj) => {
                const isSelected = selectedObjectId === obj.id;
                const topPct = obj.bbox.yMin * 100;
                const leftPct = obj.bbox.xMin * 100;
                const widthPct = (obj.bbox.xMax - obj.bbox.xMin) * 100;
                const heightPct = (obj.bbox.yMax - obj.bbox.yMin) * 100;

                return (
                  <div
                    key={obj.id}
                    onClick={() => onSelectObject && onSelectObject(obj)}
                    style={{
                      top: `${topPct}%`,
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                      borderColor: isSelected ? "#3399FF" : obj.colorHex,
                    }}
                    className={`absolute cursor-pointer border-2 transition-all ${
                      isSelected
                        ? "z-20 border-4 bg-[#3399FF]/20 shadow-lg"
                        : "z-10 bg-black/10 hover:border-white"
                    }`}
                  >
                    <div
                      style={{ backgroundColor: obj.colorHex }}
                      className="absolute left-0 top-0 -translate-y-full rounded-t px-1.5 py-0.5 text-[10px] font-bold text-white shadow"
                    >
                      {obj.label} ({(obj.confidence * 100).toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Bottom Bar: Image Metadata Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#2E2E32] bg-[#12121A] p-3 text-xs text-[#A0A4A8]">
            <div>
              <span className="font-semibold text-[#FAFAFA]">
                {analysis.metadata.format}
              </span>{" "}
              • {analysis.metadata.width}×{analysis.metadata.height}px •{" "}
              {(analysis.metadata.fileSizeBytes / 1024).toFixed(1)} KB
            </div>
            <div className="flex items-center space-x-3">
              <span className="rounded bg-[#6C5CE7]/20 px-2 py-0.5 text-[10px] font-bold text-[#6C5CE7] border border-[#6C5CE7]/30">
                Quota: {analysis.metadata.tokenQuotaUsed} Tokens
              </span>
              <span>
                Model: <strong className="text-[#3399FF]">{analysis.metadata.modelUsed}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: OCR Extraction Panel & AI Vision Description */}
        <div className="space-y-4">
          {/* AI Vision Description */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-[#3399FF]">
                AI Vision Description (GPT-4V)
              </span>
              <span className="rounded bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
                {analysis.visualSentiment} Sentiment
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#FAFAFA]">
              {analysis.aiDescription}
            </p>
          </div>

          {/* OCR Text Extraction Panel */}
          {showOcrText && (
            <div className="rounded-lg border border-[#0D9040]/40 bg-[#0A0A0B] p-4">
              <div className="mb-2 flex items-center justify-between border-b border-[#2E2E32] pb-2">
                <span className="text-xs font-bold uppercase tracking-wide text-[#0D9040]">
                  OCR Extracted Text Ledger
                </span>
                <span className="text-[10px] text-[#A0A4A8]">100% Extracted</span>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#FAFAFA]">
                &ldquo;{analysis.ocrText}&rdquo;
              </pre>
            </div>
          )}

          {/* Attribution Info */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs text-[#A0A4A8]">
            <span className="block font-semibold text-[#FAFAFA]">
              Source Attribution
            </span>
            <span>{analysis.metadata.sourceAttribution}</span>
            <span className="mt-1 block text-[11px] text-[#A0A4A8]">
              Analyzed at: {new Date(analysis.metadata.analyzedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
