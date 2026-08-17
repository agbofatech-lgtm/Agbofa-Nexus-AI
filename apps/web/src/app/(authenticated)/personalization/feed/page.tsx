"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { RecommendationExplanation } from "../components/recommendation-explanation";
import { SAMPLE_RECOMMENDATIONS } from "../mock-data";
import { RecommendationExplanationItem } from "../types";

export default function PersonalizationFeedSettingsPage(): React.JSX.Element {
  const [recommendations, setRecommendations] = useState<RecommendationExplanationItem[]>(
    SAMPLE_RECOMMENDATIONS,
  );
  const [defaultFeedType, setDefaultFeedType] = useState<
    "FOR_YOU" | "TRENDING" | "LATEST" | "TOPIC_SPECIFIC"
  >("FOR_YOU");
  const [diversitySetting, setDiversitySetting] = useState<
    "BALANCED" | "MORE_VARIETY" | "FOCUSED"
  >("BALANCED");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchFeedConfig() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string; reader_id?: string },
          { status?: string }
        >("runtime.v1.AIGatewayService", "InvokeModel", {
          tenant_id: "tenant-default",
          reader_id: "editor-default",
        });
        if (resp.status === "ERROR") {
          setError("Failed to retrieve feed configuration from BFF.");
        }
      } catch {
        // Fallback to sample recommendations
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeedConfig();
  }, []);

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
            Personalized Feed Management & Curation (PERS-002)
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
            Feed Configuration Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error || "Simulated error: unable to load feed ranking formula via BFF."}
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
  if (
    simulateMode === "empty" ||
    (recommendations.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Personalized Feed Management & Curation (PERS-002)
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
            Zero recommendations queued in personalization feed
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            No stories match your feed curation filters, or you have excluded all available packages via read-story deduplication.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setRecommendations(SAMPLE_RECOMMENDATIONS);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Recommendations
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
            Personalized Feed Curation & Ranking Formula (PERS-002 / PERS-003)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative 5-factor scoring model, anti-echo-chamber diversity enforcement, and transparent recommendation evidence
          </p>
        </div>

        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* Feed Configuration Bar */}
      <div className="grid grid-cols-1 gap-6 rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 lg:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wide text-[#3399FF]">
            Default Feed Strategy
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                { id: "FOR_YOU", label: "For You (Personalized)" },
                { id: "TRENDING", label: "Trending (Virality)" },
                { id: "LATEST", label: "Latest (Freshness)" },
                { id: "TOPIC_SPECIFIC", label: "Topic-Specific" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDefaultFeedType(opt.id)}
                className={`rounded border px-2.5 py-2 text-xs font-semibold transition-colors ${
                  defaultFeedType === opt.id
                    ? "border-[#0066CC] bg-[#0066CC] text-white"
                    : "border-[#2E2E32] bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#A0A4A8]">
            Selected: <strong className="text-[#FAFAFA]">{defaultFeedType}</strong> — blends topic relevance, quality, and freshness based on your reader profile.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wide text-[#0D9040]">
            Anti-Echo-Chamber Diversity Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "BALANCED", label: "Balanced (0.75x discount @ ≥2)" },
                { id: "MORE_VARIETY", label: "More Variety (0.50x discount @ ≥2)" },
                { id: "FOCUSED", label: "Focused (0.75x discount @ ≥3)" },
              ] as const
            ).map((div) => (
              <button
                key={div.id}
                type="button"
                onClick={() => setDiversitySetting(div.id)}
                className={`rounded border px-2.5 py-2 text-xs font-semibold transition-colors ${
                  diversitySetting === div.id
                    ? "border-[#0D9040] bg-[#0D9040] text-white"
                    : "border-[#2E2E32] bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
                }`}
              >
                {div.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#A0A4A8]">
            Current mode: <strong className="text-[#FAFAFA]">{diversitySetting}</strong> — prevents concentration around a single topic/source cluster.
          </p>
        </div>
      </div>

      {/* Visual Progress Bar Breakdown of the 5 Personalization Factors */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <h3 className="mb-1 text-sm font-bold text-[#FAFAFA]">
          Personalization Factors Weight Distribution
        </h3>
        <p className="mb-4 text-xs text-[#A0A4A8]">
          Every candidate package is evaluated against this authoritative formula and clamped to <code className="font-mono text-[#FAFAFA]">[0.0, 1.0]</code>
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5 rounded border border-[#0066CC]/30 bg-[#0A0A0B] p-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#3399FF]">Topic Relevance</span>
              <span className="font-mono text-[#FAFAFA]">35%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#2E2E32]">
              <div className="h-1.5 w-[35%] rounded-full bg-[#0066CC]" />
            </div>
            <p className="text-[10px] text-[#A0A4A8]">
              Matches story topics to explicit and inferred reader interest scores.
            </p>
          </div>

          <div className="space-y-1.5 rounded border border-[#0066CC]/30 bg-[#0A0A0B] p-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#3399FF]">Content Quality</span>
              <span className="font-mono text-[#FAFAFA]">25%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#2E2E32]">
              <div className="h-1.5 w-[25%] rounded-full bg-[#0066CC]" />
            </div>
            <p className="text-[10px] text-[#A0A4A8]">
              Integrates authoritative AGT-024 Verification Agent score (default 0.92).
            </p>
          </div>

          <div className="space-y-1.5 rounded border border-[#0066CC]/30 bg-[#0A0A0B] p-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#3399FF]">Freshness</span>
              <span className="font-mono text-[#FAFAFA]">20%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#2E2E32]">
              <div className="h-1.5 w-[20%] rounded-full bg-[#0066CC]" />
            </div>
            <p className="text-[10px] text-[#A0A4A8]">
              Time-decay function favoring recently published newsroom packages.
            </p>
          </div>

          <div className="space-y-1.5 rounded border border-[#0066CC]/30 bg-[#0A0A0B] p-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#3399FF]">Source Pref</span>
              <span className="font-mono text-[#FAFAFA]">10%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#2E2E32]">
              <div className="h-1.5 w-[10%] rounded-full bg-[#0066CC]" />
            </div>
            <p className="text-[10px] text-[#A0A4A8]">
              Weights preferred social desks and verified news wire services.
            </p>
          </div>

          <div className="space-y-1.5 rounded border border-[#0D9040]/30 bg-[#0A0A0B] p-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#0D9040]">Diversity</span>
              <span className="font-mono text-[#FAFAFA]">10%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#2E2E32]">
              <div className="h-1.5 w-[10%] rounded-full bg-[#0D9040]" />
            </div>
            <p className="text-[10px] text-[#A0A4A8]">
              Anti-echo-chamber score promoting broad topic exploration.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation Explanations Component */}
      <RecommendationExplanation items={recommendations} />
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
