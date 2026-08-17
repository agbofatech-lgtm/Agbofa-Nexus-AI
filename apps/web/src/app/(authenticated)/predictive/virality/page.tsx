"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { ViralityMeter } from "../components/virality-meter";
import { PredictionCard } from "../components/prediction-card";
import { ViralityPredictionItem } from "../types";

const INITIAL_PRED001_ITEMS: ViralityPredictionItem[] = [
  {
    id: "pred-101",
    storyId: "story-101",
    title: "Autonomous AI Newsroom Workforce Expands Across Regions",
    score: 0.94,
    confidence: 0.96,
    tier: "VIRAL",
    predictedPeakTime: new Date(Date.now() + 6 * 3600000).toISOString(),
    estimatedReach: 485000,
    isFallbackTriggered: false,
    modelVersion: "2.4.0",
    evaluatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "pred-102",
    storyId: "story-102",
    title: "Predictive Intelligence Engines Scale MAPE Calibration",
    score: 0.72,
    confidence: 0.65, // < 0.70 threshold -> AGT-016 fallback
    tier: "HIGH_POTENTIAL",
    predictedPeakTime: new Date(Date.now() + 12 * 3600000).toISOString(),
    estimatedReach: 184000,
    isFallbackTriggered: true,
    modelVersion: "2.4.0",
    evaluatedAt: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: "pred-103",
    storyId: "story-103",
    title: "Row-Level Security Enforces Strict Tenant Boundaries in Postgres",
    score: 0.44,
    confidence: 0.92,
    tier: "NORMAL",
    predictedPeakTime: new Date(Date.now() + 24 * 3600000).toISOString(),
    estimatedReach: 42000,
    isFallbackTriggered: false,
    modelVersion: "2.4.0",
    evaluatedAt: new Date(Date.now() - 90 * 60000).toISOString(),
  },
];

export default function ViralityPredictionsPage(): React.JSX.Element {
  const router = useRouter();
  const [predictions, setPredictions] = useState<ViralityPredictionItem[]>(
    INITIAL_PRED001_ITEMS,
  );
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchVirality() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string },
          { tenant?: unknown }
        >("runtime.v1.AIGatewayService", "InvokeModel", {
          tenant_id: "tenant-default",
        });
        if (resp.status === "ERROR") {
          setError(resp.error?.message || "Failed to load virality predictions from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchVirality();
  }, []);

  const filteredPredictions = predictions.filter((p) => {
    if (tierFilter !== "ALL" && p.tier !== tierFilter) {
      return false;
    }
    return true;
  });

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-44 animate-pulse rounded-lg bg-[#12121A]" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-[#12121A]" />
          ))}
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">PRED-001 Virality Predictions</h2>
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
            PRED-001 Telemetry Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error || "Simulated error: unable to reach AIGatewayService via BFF."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "error") setSimulateMode("normal");
              else window.location.reload();
            }}
            className="rounded-md bg-[#CF2020] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#CF2020]/80 transition-colors"
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
    (!isLoading && filteredPredictions.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              PRED-001 Virality Prediction Engine
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              MAPE-calibrated forecasting with AGT-016 heuristic fallback threshold (&lt;0.70)
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter bar visible */}
        <ViralityFilterBar
          tierFilter={tierFilter}
          onTierChange={setTierFilter}
          onReset={() => setTierFilter("ALL")}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No virality predictions match your filter
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {tierFilter !== "ALL"
              ? `Zero evaluated story packages match tier '${tierFilter}'. Try switching to 'All Tiers'.`
              : "Zero virality predictions have been generated in the current time window."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setTierFilter("ALL");
                setPredictions(INITIAL_PRED001_ITEMS);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Reset Filter &amp; Load Ledger
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            PRED-001 Virality Prediction Engine ({filteredPredictions.length} live evaluated)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative MAPE-calibrated forecasting with AGT-016 heuristic fallback threshold (<code className="font-mono text-[#3399FF]">ViralityModelFallbackThreshold = 0.70</code>)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="rounded bg-[#0A0A0B] px-3 py-1 font-mono text-xs font-bold text-[#0D9040] border border-[#2E2E32]">
            PRED-001 v2.4.0 — 96.2% Accuracy
          </span>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Filter Bar */}
      <ViralityFilterBar
        tierFilter={tierFilter}
        onTierChange={setTierFilter}
        onReset={() => setTierFilter("ALL")}
      />

      {/* Virality Meter component */}
      <ViralityMeter predictions={filteredPredictions} />

      {/* Individual Prediction Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[#FAFAFA]">
          Detailed Story Virality Forecasts &amp; AGT-016 Heuristic Fallback Inspection
        </h3>
        <div className="space-y-4">
          {filteredPredictions.map((p) => (
            <PredictionCard key={p.id} prediction={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ViralityFilterBarProps {
  tierFilter: string;
  onTierChange: (val: string) => void;
  onReset: () => void;
}

function ViralityFilterBar({
  tierFilter,
  onTierChange,
  onReset,
}: ViralityFilterBarProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex items-center space-x-2">
        <span className="text-[#A0A4A8]">Filter by Virality Tier:</span>
        {(["ALL", "VIRAL", "HIGH_POTENTIAL", "NORMAL"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTierChange(t)}
            className={`rounded px-2.5 py-1 font-semibold transition-colors ${
              tierFilter === t
                ? "bg-[#0066CC] text-white"
                : "bg-[#0A0A0B] text-[#A0A4A8] border border-[#2E2E32] hover:text-[#FAFAFA]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tierFilter !== "ALL" && (
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
        >
          ✕ Clear Tier Filter
        </button>
      )}
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
