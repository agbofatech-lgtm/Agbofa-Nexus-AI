"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { TranscriptionPanel } from "../components/transcription-panel";
import { SpeakerTimeline } from "../components/speaker-timeline";
import { AudioSentiment } from "../components/audio-sentiment";
import { SAMPLE_AUDIO_ANALYSIS } from "../mock-data";
import { AudioAnalysisItem } from "../types";

export default function MultimodalAudioAnalysisPage(): React.JSX.Element {
  const [analysis, setAnalysis] = useState<AudioAnalysisItem>(SAMPLE_AUDIO_ANALYSIS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchAudioAnalysis() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string; media_type: string },
          { status?: string }
        >("runtime.v1.AIGatewayService", "InvokeModel", {
          tenant_id: "tenant-default",
          media_type: "AUDIO",
        });
        if (resp.status === "ERROR") {
          setError("Failed to retrieve audio transcription ledger from BFF proxy.");
        }
      } catch {
        // Fallback to sample audio analysis
      } finally {
        setIsLoading(false);
      }
    }
    fetchAudioAnalysis();
  }, []);

  const handleSeekTimestamp = (startMs: number) => {
    const sec = (startMs / 1000).toFixed(1);
    alert(`Seeking audio playback to timestamp: ${sec}s (${startMs} ms).`);
  };

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
            Audio Transcription & Diarization (AGT-013)
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
            Audio Analysis Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error ||
              "Simulated error: unable to contact AI Gateway audio transcription via BFF proxy."}
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
            Audio Transcription & Diarization (AGT-013)
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
            Zero audio transcriptions recorded today
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            No audio clips have been submitted to Whisper-1 for speech-to-text transcription or diarization in this window.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setAnalysis(SAMPLE_AUDIO_ANALYSIS);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Audio Analysis
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
            Audio Transcription, Speaker Diarization & Sentiment (AGT-013 / Whisper-1)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative speech-to-text timestamps, color-coded speaker turns, sentiment breakdown, and quota accounting
          </p>
        </div>

        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* Visual Speaker Timeline Bar Component */}
      <SpeakerTimeline
        legend={analysis.speakerLegend}
        segments={analysis.speakerSegments}
        totalDurationSeconds={analysis.metadata.durationSeconds}
        onSelectSegment={handleSeekTimestamp}
      />

      {/* Transcription Panel Component */}
      <TranscriptionPanel
        segments={analysis.speakerSegments}
        onSeekTimestamp={handleSeekTimestamp}
      />

      {/* Audio Sentiment Breakdown Component */}
      <AudioSentiment
        sentiment={analysis.sentimentBreakdown}
        segments={analysis.speakerSegments}
      />

      {/* Audio Metadata Panel */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <h3 className="mb-3 text-sm font-bold text-[#FAFAFA]">
          Audio Clip Metadata & Quota Ledger (IMP-020)
        </h3>
        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3">
            <span className="block font-semibold text-[#A0A4A8]">Format / Language</span>
            <span className="font-mono font-bold text-[#FAFAFA]">
              {analysis.metadata.format} ({analysis.metadata.detectedLanguage})
            </span>
          </div>
          <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3">
            <span className="block font-semibold text-[#A0A4A8]">Duration / Model</span>
            <span className="font-mono font-bold text-[#3399FF]">
              {analysis.metadata.durationSeconds}s • {analysis.metadata.transcriptionModel}
            </span>
          </div>
          <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3">
            <span className="block font-semibold text-[#A0A4A8]">Token Quota Used</span>
            <span className="font-mono font-bold text-[#0D9040]">
              {analysis.metadata.tokenQuotaUsed} Tokens / clip
            </span>
          </div>
          <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3">
            <span className="block font-semibold text-[#A0A4A8]">Source Attribution</span>
            <span className="font-semibold text-[#FAFAFA]">
              {analysis.metadata.sourceAttribution}
            </span>
          </div>
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
