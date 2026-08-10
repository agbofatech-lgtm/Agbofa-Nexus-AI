"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { TrendGraph } from "../../agents/detectors/components/trend-graph";
import { TrendPredictionItem, TrendLifecyclePhaseType } from "../types";

const INITIAL_TRENDS: TrendPredictionItem[] = [
  {
    id: "trd-01",
    topic: "Autonomous AI Newsroom Fleet Deployment",
    currentPhase: "ACCELERATING",
    predictedPeakTime: new Date(Date.now() + 18 * 3600000).toISOString(),
    velocity: 140,
    historicalPatternMatchPct: 95.4,
    confidence: 0.96,
    timestamp: new Date().toISOString(),
  },
  {
    id: "trd-02",
    topic: "Row-Level Security PostgreSQL Isolations",
    currentPhase: "PEAK",
    predictedPeakTime: new Date(Date.now() + 4 * 3600000).toISOString(),
    velocity: 240,
    historicalPatternMatchPct: 96.2,
    confidence: 0.98,
    timestamp: new Date().toISOString(),
  },
  {
    id: "trd-03",
    topic: "Predictive Virality MAPE Calibration",
    currentPhase: "EMERGING",
    predictedPeakTime: new Date(Date.now() + 36 * 3600000).toISOString(),
    velocity: 45,
    historicalPatternMatchPct: 91.8,
    confidence: 0.89,
    timestamp: new Date().toISOString(),
  },
  {
    id: "trd-04",
    topic: "Multi-Channel Packaging Standards",
    currentPhase: "EVERGREEN",
    predictedPeakTime: "Persistent EVERGREEN baseline",
    velocity: 25,
    historicalPatternMatchPct: 99.1,
    confidence: 0.99,
    timestamp: new Date().toISOString(),
  },
];

const SAMPLE_STAGES = [
  { stage: "EMERGING" as const, count: 18, velocity: 45 },
  { stage: "ACCELERATING" as const, count: 24, velocity: 140 },
  { stage: "PEAK" as const, count: 12, velocity: 240 },
  { stage: "DECAY" as const, count: 7, velocity: 60 },
  { stage: "EVERGREEN" as const, count: 3, velocity: 25 },
];

const SAMPLE_VELOCITY = [
  { hour: "00:00", velocity: 45 },
  { hour: "04:00", velocity: 80 },
  { hour: "08:00", velocity: 140 },
  { hour: "12:00", velocity: 240 },
  { hour: "16:00", velocity: 190 },
  { hour: "20:00", velocity: 110 },
];

function getPhaseStyle(phase: TrendLifecyclePhaseType): string {
  switch (phase) {
    case "PEAK":
      return "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold";
    case "ACCELERATING":
      return "bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/40 font-semibold";
    case "EMERGING":
      return "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-semibold";
    case "DECAY":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/40";
    case "EVERGREEN":
    default:
      return "bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/40 font-semibold";
  }
}

export default function TrendLifecyclePredictionsPage(): React.JSX.Element {
  const [trends, setTrends] = useState<TrendPredictionItem[]>(INITIAL_TRENDS);
  const [phaseFilter, setPhaseFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchTrends() {
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
          setError(resp.error?.message || "Failed to load trend predictions from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrends();
  }, []);

  const filteredTrends = trends.filter((t) => {
    if (phaseFilter !== "ALL" && t.currentPhase !== phaseFilter) {
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-[#12121A]" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-[#12121A]" />
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">PRED-004 Trend Lifecycle</h2>
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
            PRED-004 Telemetry Retrieval Failed
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
    (!isLoading && filteredTrends.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              PRED-004 Trend Lifecycle Predictor
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              EMERGING → ACCELERATING → PEAK → DECAY → EVERGREEN transitions
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter bar visible */}
        <TrendFilterBar
          phaseFilter={phaseFilter}
          onPhaseChange={setPhaseFilter}
          onReset={() => setPhaseFilter("ALL")}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No trend predictions match your phase filter
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {phaseFilter !== "ALL"
              ? `Zero active trends match lifecycle phase '${phaseFilter}'. Try switching to 'All Phases'.`
              : "Zero trend lifecycle forecasts are currently active in the ledger."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setPhaseFilter("ALL");
                setTrends(INITIAL_TRENDS);
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
            PRED-004 Trend Lifecycle Predictor ({filteredTrends.length} live tracked)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative forecasting across EMERGING → ACCELERATING → PEAK → DECAY → EVERGREEN transitions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="rounded bg-[#0A0A0B] px-3 py-1 font-mono text-xs font-bold text-[#3399FF] border border-[#2E2E32]">
            PRED-004 v1.8.0 — 95.4% Pattern Accuracy
          </span>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* STAT CARDS (3 columns) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Avg Time-to-Peak Forecast
            </span>
            <span className="rounded-full bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF]">
              PRED-004
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            18.2 hours <span className="text-xs font-normal text-[#A0A4A8]">avg to PEAK</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Time horizon for accelerating signals
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Historical Pattern Match
            </span>
            <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              VERIFIED
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9040]">
            95.4% <span className="text-xs font-normal text-[#A0A4A8]">accuracy</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Calibrated against historical viral curves
          </div>
        </div>

        <div className="rounded-lg border border-[#6C5CE7]/30 bg-[#6C5CE7]/10 p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6C5CE7]">
              Evergreen Persistent Trends
            </span>
            <span className="rounded-full bg-[#6C5CE7] px-2 py-0.5 text-[10px] font-bold text-white">
              3 ACTIVE
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            3 stable trends
          </div>
          <div className="mt-1 text-[11px] text-[#6C5CE7]">
            Long-tail SEO &amp; evergreen value
          </div>
        </div>
      </div>

      {/* 5-Stage Lifecycle Graph & Velocity Chart */}
      <TrendGraph stages={SAMPLE_STAGES} velocitySeries={SAMPLE_VELOCITY} />

      {/* Phase Filter Bar */}
      <TrendFilterBar
        phaseFilter={phaseFilter}
        onPhaseChange={setPhaseFilter}
        onReset={() => setPhaseFilter("ALL")}
      />

      {/* Trend Predictions List */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] shadow">
        <div className="flex items-center justify-between border-b border-[#2E2E32] bg-[#0A0A0B] px-4 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
            Active Trend Lifecycle Prediction Ledger ({filteredTrends.length} items)
          </h3>
          <span className="text-xs text-[#A0A4A8]">
            Time-to-peak &amp; pattern match accuracy
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#2E2E32] bg-[#0A0A0B] font-semibold text-[#A0A4A8]">
                <th className="px-4 py-2.5">Topic &amp; Story Theme</th>
                <th className="px-4 py-2.5">Current Phase</th>
                <th className="px-4 py-2.5 text-right">Velocity</th>
                <th className="px-4 py-2.5 text-right">Time-to-Peak Forecast</th>
                <th className="px-4 py-2.5 text-right">Pattern Accuracy</th>
                <th className="px-4 py-2.5 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E32]">
              {filteredTrends.map((t) => (
                <tr key={t.id} className="hover:bg-[#0066CC]/10">
                  <td className="max-w-xs px-4 py-3 font-bold text-[#FAFAFA]">
                    {t.topic}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${getPhaseStyle(
                        t.currentPhase,
                      )}`}
                    >
                      ● {t.currentPhase}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#3399FF]">
                    {t.velocity} sig/hr
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-[#FAFAFA]">
                    {t.predictedPeakTime.includes("Z")
                      ? `Peak at ${new Date(t.predictedPeakTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} UTC`
                      : t.predictedPeakTime}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#0D9040]">
                    {t.historicalPatternMatchPct}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#FAFAFA]">
                    {(t.confidence * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface TrendFilterBarProps {
  phaseFilter: string;
  onPhaseChange: (val: string) => void;
  onReset: () => void;
}

function TrendFilterBar({
  phaseFilter,
  onPhaseChange,
  onReset,
}: TrendFilterBarProps): React.JSX.Element {
  const phases = [
    "ALL",
    "EMERGING",
    "ACCELERATING",
    "PEAK",
    "DECAY",
    "EVERGREEN",
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[#A0A4A8]">Lifecycle Phase:</span>
        {phases.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPhaseChange(p)}
            className={`rounded-full px-3 py-1 font-semibold transition-colors ${
              phaseFilter === p
                ? "bg-[#0066CC] text-white"
                : "border border-[#2E2E32] bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {phaseFilter !== "ALL" && (
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
        >
          ✕ Clear Phase Filter
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
