"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../lib/bff/client";
import { PredictionCard } from "./components/prediction-card";
import { ViralityPredictionItem, PredictiveOverviewStats } from "./types";

const INITIAL_OVERVIEW_STATS: PredictiveOverviewStats = {
  activePredictionsToday: 1480,
  avgModelAccuracy: 0.948,
  viralPredictionsCount: 142,
  viralPercentage: 28,
  activeAnomaliesCount: 4,
  criticalAnomaliesCount: 1,
};

const SAMPLE_VIRALITY_PREDICTIONS: ViralityPredictionItem[] = [
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
    confidence: 0.65, // < 0.70 threshold -> AGT-016 heuristic fallback
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

export default function PredictiveOverviewDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const [stats, setStats] = useState<PredictiveOverviewStats>(INITIAL_OVERVIEW_STATS);
  const [predictions, setPredictions] = useState<ViralityPredictionItem[]>(
    SAMPLE_VIRALITY_PREDICTIONS,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchPredictiveOverview() {
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
          setError(
            resp.error?.message ||
              "Failed to load predictive intelligence telemetry from BFF.",
          );
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPredictiveOverview();
  }, []);

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-[#12121A]" />
          ))}
        </div>
        <div className="h-64 w-full animate-pulse rounded-lg bg-[#12121A]" />
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Predictive Intelligence Overview
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
            Predictive Telemetry Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error || "Simulated error: unable to reach AIGatewayService via BFF proxy."}
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
    (!isLoading && predictions.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Predictive Intelligence Overview
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
            Zero active predictions generated today
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            The 6 predictive intelligence engines have zero forecast events queued in the selected window.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setPredictions(SAMPLE_VIRALITY_PREDICTIONS);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Predictive Ledger
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-8">
      {/* Top Title & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            Authoritative Predictive Intelligence Dashboard (IMP-018)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Monitoring 6 prediction engines (PRED-001–006), time-series forecasts, and MAPE calibration
          </p>
        </div>
        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* STAT CARDS Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => router.push("/predictive/virality")}
          className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow transition-all hover:border-[#0066CC]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Active Predictions Today
            </span>
            <span className="rounded-full bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF] border border-[#0066CC]/30">
              6 ENGINES
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {stats.activePredictionsToday.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            PRED-001–006 continuous evaluation
          </div>
        </div>

        <div
          onClick={() => router.push("/predictive/models")}
          className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow transition-all hover:border-[#0D9040]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Model Accuracy
            </span>
            <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040] border border-[#0D9040]/30">
              4.2% MAPE
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9040]">
            {(stats.avgModelAccuracy * 100).toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Avg across all 6 prediction models
          </div>
        </div>

        <div
          onClick={() => router.push("/predictive/virality")}
          className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow transition-all hover:border-[#CF2020]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Virality Predictions
            </span>
            <span className="rounded-full bg-[#CF2020]/20 px-2 py-0.5 text-[10px] font-bold text-[#CF2020] border border-[#CF2020]/30">
              {stats.viralPercentage}% VIRAL
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {stats.viralPredictionsCount} VIRAL
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            High amplification trajectory
          </div>
        </div>

        <div
          onClick={() => router.push("/predictive/anomalies")}
          className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow transition-all hover:border-amber-400"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Anomalies Detected
            </span>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
              {stats.criticalAnomaliesCount} CRITICAL
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {stats.activeAnomaliesCount} Active
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            2+ consecutive confirmations required
          </div>
        </div>
      </div>

      {/* QUICK LINKS to each of the 6 prediction engines */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
          Predictive Intelligence Engine Workspace Navigation
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            onClick={() => router.push("/predictive/virality")}
            className="group cursor-pointer rounded-lg border border-[#0066CC]/30 bg-[#0066CC]/10 p-4 transition-all hover:border-[#0066CC] hover:shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#3399FF]">
                PRED-001 Virality Engine
              </span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <p className="mt-1 text-xs text-[#FAFAFA]">
              MAPE trajectory forecasting with AGT-016 heuristic fallback threshold (&lt;0.70).
            </p>
          </div>

          <div
            onClick={() => router.push("/predictive/engagement")}
            className="group cursor-pointer rounded-lg border border-[#6C5CE7]/30 bg-[#6C5CE7]/10 p-4 transition-all hover:border-[#6C5CE7] hover:shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6C5CE7]">
                PRED-002 Audience Forecaster
              </span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <p className="mt-1 text-xs text-[#FAFAFA]">
              Engagement rate forecasting per audience segment with cold-start priors.
            </p>
          </div>

          <div
            onClick={() => router.push("/predictive/trends")}
            className="group cursor-pointer rounded-lg border border-[#0D9040]/30 bg-[#0D9040]/10 p-4 transition-all hover:border-[#0D9040] hover:shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D9040]">
                PRED-004 Trend Lifecycle
              </span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <p className="mt-1 text-xs text-[#FAFAFA]">
              EMERGING → ACCELERATING → PEAK → DECAY → EVERGREEN transitions.
            </p>
          </div>

          <div
            onClick={() => router.push("/predictive/anomalies")}
            className="group cursor-pointer rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 transition-all hover:border-amber-400 hover:shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                PRED-005 Anomaly Detector
              </span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <p className="mt-1 text-xs text-[#FAFAFA]">
              SPIKE, DROP, DIVERGENCE alerts with 2+ consecutive confirmation guard.
            </p>
          </div>

          <div
            onClick={() => router.push("/predictive/publishing")}
            className="group cursor-pointer rounded-lg border border-[#0066CC]/30 bg-[#0066CC]/10 p-4 transition-all hover:border-[#0066CC] hover:shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#3399FF]">
                PRED-006 Publishing Time
              </span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <p className="mt-1 text-xs text-[#FAFAFA]">
              Optimal publishing windows per platform with breaking news overrides.
            </p>
          </div>

          <div
            onClick={() => router.push("/predictive/models")}
            className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 transition-all hover:border-[#FAFAFA] hover:shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FAFAFA]">
                Model Management (6 Engines)
              </span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <p className="mt-1 text-xs text-[#A0A4A8]">
              Manage PRED-001–006 versions, accuracy ledgers, and promote/retire actions.
            </p>
          </div>
        </div>
      </div>

      {/* RECENT PREDICTIONS FEED */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-3">
          <h3 className="text-sm font-bold text-[#FAFAFA]">
            Recent Authoritative Virality Predictions (PRED-001 Ledger)
          </h3>
          <span className="text-xs text-[#A0A4A8]">
            Showing {predictions.length} live evaluated packages
          </span>
        </div>
        <div className="space-y-4">
          {predictions.map((p) => (
            <PredictionCard key={p.id} prediction={p} />
          ))}
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
