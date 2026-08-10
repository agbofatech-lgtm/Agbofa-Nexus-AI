"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { KeyFrameStrip } from "../components/key-frame-strip";
import { SAMPLE_VIDEO_ANALYSIS } from "../mock-data";
import { VideoAnalysisItem, KeyFrameItem } from "../types";

export default function MultimodalVideoAnalysisPage(): React.JSX.Element {
  const [analysis, setAnalysis] = useState<VideoAnalysisItem>(SAMPLE_VIDEO_ANALYSIS);
  const [selectedFrameId, setSelectedFrameId] = useState<string>("kf-1");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchVideoAnalysis() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string; media_type: string },
          { status?: string }
        >("runtime.v1.AIGatewayService", "InvokeModel", {
          tenant_id: "tenant-default",
          media_type: "VIDEO",
        });
        if (resp.status === "ERROR") {
          setError("Failed to retrieve video analysis ledger from BFF proxy.");
        }
      } catch {
        // Fallback to sample video analysis
      } finally {
        setIsLoading(false);
      }
    }
    fetchVideoAnalysis();
  }, []);

  const selectedFrame =
    analysis.keyFrames.find((f) => f.id === selectedFrameId) ||
    analysis.keyFrames[0];

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-96 w-full animate-pulse rounded-lg bg-[#12121A]" />
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Video Analysis & Key Frame Extraction (AGT-013)
          </h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div
          role="alert"
          aria-live="assertive"
          className="mx-auto max-w-lg rounded-lg border border-[#CF2020] bg-[#12121A] p-6 text-center shadow-xl"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#CF2020]/20 text-2xl text-[#CF2020]">
            ⚠
          </div>
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            Video Analysis Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error ||
              "Simulated error: unable to contact AI Gateway video analysis via BFF proxy."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "error") setSimulateMode("normal");
              else window.location.reload();
            }}
            className="rounded-md bg-[#CF2020] px-4 py-2 text-xs font-semibold text-[#FAFAFA]"
          >
            Retry Retrieval
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (simulateMode === "empty") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Video Analysis & Key Frame Extraction (AGT-013)
          </h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            Zero video analyses recorded today
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            No video assets have been submitted to AGT-013 for key frame extraction or temporal scene recognition in this window.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setAnalysis(SAMPLE_VIDEO_ANALYSIS);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Video Analysis
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-8">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-3">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            Video Analysis, Key Frames & Temporal Scene Events (AGT-013 / Claude Vision)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative max-5-frame extraction strip, scene description ledgers, temporal actor recognition, and video metadata
          </p>
        </div>

        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* Key Frame Strip Component */}
      <KeyFrameStrip
        keyFrames={analysis.keyFrames}
        selectedFrameId={selectedFrameId}
        onSelectFrame={setSelectedFrameId}
      />

      {/* Frame Detail (Expanded View) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Large Frame Image */}
        <div className="overflow-hidden rounded-lg border border-[#2E2E32] bg-[#0A0A0B] lg:col-span-2">
          <div className="relative aspect-video w-full bg-[#12121A]">
            <img
              src={selectedFrame.frameUrl}
              alt={selectedFrame.sceneDescription}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-1 font-mono text-xs font-bold text-[#FAFAFA]">
              Timestamp: {selectedFrame.timestampDisplay} (Frame #{selectedFrame.frameNumber})
            </div>
            <div className="absolute right-2 top-2 rounded bg-[#0D9040]/80 px-2 py-1 font-mono text-xs font-bold text-white">
              {selectedFrame.detectedObjects.length} Objects Detected
            </div>
          </div>

          <div className="p-4">
            <h4 className="text-sm font-bold text-[#FAFAFA]">
              Frame #{selectedFrame.frameNumber} Scene Description
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-[#A0A4A8]">
              {selectedFrame.sceneDescription}
            </p>
          </div>
        </div>

        {/* Right Panel: Detected Objects in Frame & Video Metadata */}
        <div className="space-y-4">
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#3399FF]">
              Objects in Frame #{selectedFrame.frameNumber}
            </h4>
            {selectedFrame.detectedObjects.length === 0 ? (
              <p className="text-xs text-[#A0A4A8]">
                No distinct bounding box targets in this frame.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedFrame.detectedObjects.map((obj) => (
                  <div
                    key={obj.id}
                    className="flex items-center justify-between rounded border border-[#2E2E32] bg-[#0A0A0B] p-2 text-xs"
                  >
                    <span className="font-bold text-[#FAFAFA]">{obj.label}</span>
                    <span className="font-mono text-xs text-[#0D9040]">
                      {(obj.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video Metadata Panel */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 space-y-2 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#FAFAFA]">
              Video Metadata & Quota Accounting
            </h4>
            <div className="flex justify-between">
              <span className="text-[#A0A4A8]">Format / Resolution:</span>
              <span className="font-mono text-[#FAFAFA]">
                {analysis.metadata.format} ({analysis.metadata.resolution})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A4A8]">Duration / Frame Rate:</span>
              <span className="font-mono text-[#FAFAFA]">
                {analysis.metadata.durationSeconds}s @ {analysis.metadata.frameRateFps} fps
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A4A8]">Key Frames Quota:</span>
              <span className="font-mono text-[#0D9040]">
                {analysis.metadata.keyFramesExtracted} / 5 Max Allowed
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A4A8]">Model Used:</span>
              <span className="font-mono text-[#3399FF]">
                {analysis.metadata.modelUsed}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A4A8]">Token Quota Used:</span>
              <span className="font-mono text-[#6C5CE7]">
                {analysis.metadata.tokenQuotaUsed} Tokens
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Temporal Analysis Section (Scene Change Timeline & Events) */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <div className="mb-4 border-b border-[#2E2E32] pb-3">
          <h3 className="text-sm font-bold text-[#FAFAFA]">
            Temporal Action & Scene Change Ledger (AGT-013)
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            Sequential timeline of event transitions, actor appearances, and scene confidence scores
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {analysis.temporalEvents.map((ev) => {
            const confPct = Math.round(ev.confidence * 100);
            return (
              <div
                key={ev.id}
                className="flex flex-col justify-between rounded-lg border border-[#0066CC]/30 bg-[#0A0A0B] p-4 space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-[#0066CC]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#3399FF]">
                      ⏱ {ev.timestampRange}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#0D9040]">
                      {confPct}%
                    </span>
                  </div>
                  <h4 className="mt-2 text-xs font-bold text-[#FAFAFA]">
                    {ev.eventLabel}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-1 border-t border-[#2E2E32] pt-2">
                  <span className="text-[10px] text-[#A0A4A8]">Actors:</span>
                  {ev.detectedActors.map((actor, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-[#2E2E32] px-1.5 py-0.5 font-mono text-[10px] text-[#FAFAFA]"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface SimulationToolbarProps {
  currentMode: "normal" | "loading" | "empty" | "error";
  onSelectMode: (mode: "normal" | "loading" | "empty" | "error") => void;
}

function SimulationToolbar({ currentMode, onSelectMode }: SimulationToolbarProps): React.JSX.Element {
  return (
    <div className="flex items-center space-x-1 rounded-md border border-[#2E2E32] bg-[#0A0A0B] p-1 text-[11px]">
      <span className="px-1 text-[#A0A4A8]">State:</span>
      {(["normal", "loading", "empty", "error"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSelectMode(mode)}
          className={`rounded px-2 py-0.5 font-medium transition-colors ${
            currentMode === mode
              ? "bg-[#0066CC] text-[#FAFAFA]"
              : "text-[#A0A4A8] hover:bg-[#12121A] hover:text-[#FAFAFA]"
          }`}
        >
          {mode.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
