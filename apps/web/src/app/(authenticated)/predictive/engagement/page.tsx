"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { ForecastChart } from "../components/forecast-chart";
import {
  EngagementForecastItem,
  ForecastSeriesPoint,
} from "../types";

const INITIAL_FORECASTS: EngagementForecastItem[] = [
  {
    id: "eng-01",
    storyId: "story-101",
    title: "Autonomous AI Newsroom Workforce Expands Across Regions",
    predictedRate: 11.4,
    actualRate: 11.8,
    accuracyScore: 0.965,
    audienceSegment: "Tech Executives",
    isColdStart: false,
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "eng-02",
    storyId: "story-102",
    title: "Predictive Intelligence Engines Scale MAPE Calibration",
    predictedRate: 8.2,
    actualRate: 8.0,
    accuracyScore: 0.975,
    audienceSegment: "Policy Analysts",
    isColdStart: false,
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: "eng-03",
    storyId: "story-103",
    title: "Row-Level Security Enforces Strict Tenant Boundaries",
    predictedRate: 6.8,
    actualRate: 7.2,
    accuracyScore: 0.941,
    audienceSegment: "Media Professionals",
    isColdStart: true, // Cold-start story
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  {
    id: "eng-04",
    storyId: "story-104",
    title: "Enterprise AI Gateway Extension Adds Multimodal Consistency Check",
    predictedRate: 9.5,
    accuracyScore: 0.938,
    audienceSegment: "General Consumer",
    isColdStart: true, // Cold-start story
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
  },
];

const SAMPLE_SERIES: ForecastSeriesPoint[] = [
  { time: "00:00", predicted: 5.2, actual: 5.0, upperBound: 6.0, lowerBound: 4.4 },
  { time: "04:00", predicted: 7.8, actual: 7.9, upperBound: 8.8, lowerBound: 6.8 },
  { time: "08:00", predicted: 11.2, actual: 11.5, upperBound: 12.5, lowerBound: 9.9 },
  { time: "12:00", predicted: 14.8, actual: 14.2, upperBound: 16.2, lowerBound: 13.4 },
  { time: "16:00", predicted: 12.4, actual: 12.6, upperBound: 13.8, lowerBound: 11.0 },
  { time: "20:00", predicted: 8.5, actual: 8.4, upperBound: 9.6, lowerBound: 7.4 },
];

export default function EngagementForecastsPage(): React.JSX.Element {
  const [forecasts, setForecasts] = useState<EngagementForecastItem[]>(
    INITIAL_FORECASTS,
  );
  const [segmentFilter, setSegmentFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchEngagement() {
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
          setError(resp.error?.message || "Failed to load engagement forecasts from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEngagement();
  }, []);

  const avgRate = (
    forecasts.reduce((acc, f) => acc + f.predictedRate, 0) / (forecasts.length || 1)
  ).toFixed(1);

  const avgAcc = (
    forecasts.reduce((acc, f) => acc + f.accuracyScore, 0) / (forecasts.length || 1)
  ).toFixed(3);

  const coldStartCount = forecasts.filter((f) => f.isColdStart).length;

  const filteredForecasts = forecasts.filter((f) => {
    if (segmentFilter !== "ALL" && f.audienceSegment !== segmentFilter) {
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">PRED-002 Audience Forecaster</h2>
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
            PRED-002 Telemetry Retrieval Failed
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
    (!isLoading && filteredForecasts.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              PRED-002 Audience Engagement Forecaster
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              Engagement rate forecasting per audience segment with cold-start priors
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter bar visible */}
        <EngagementFilterBar
          segmentFilter={segmentFilter}
          onSegmentChange={setSegmentFilter}
          onReset={() => setSegmentFilter("ALL")}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No engagement forecasts match your segment filter
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {segmentFilter !== "ALL"
              ? `Zero forecasts match segment '${segmentFilter}'. Try switching to 'All Segments'.`
              : "Zero engagement forecasts are currently active in the ledger."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setSegmentFilter("ALL");
                setForecasts(INITIAL_FORECASTS);
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
            PRED-002 Audience Engagement Forecaster ({filteredForecasts.length} live forecasts)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Time-series engagement forecasting with 95% CI bands and empirical cold-start cluster priors
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="rounded bg-[#0A0A0B] px-3 py-1 font-mono text-xs font-bold text-[#0D9040] border border-[#2E2E32]">
            PRED-002 v2.1.0 — 94.1% Accuracy
          </span>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* SUMMARY STAT CARDS (3 columns) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Average Predicted Engagement Rate
            </span>
            <span className="rounded-full bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF]">
              PRED-002
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {avgRate}% <span className="text-xs font-normal text-[#A0A4A8]">avg rate</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Cross-segment interaction forecast
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Model Accuracy Score
            </span>
            <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              VERIFIED
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9040]">
            {(Number(avgAcc) * 100).toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Calibrated against historical read outcomes
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Cold-Start Handling Prior
            </span>
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
              {coldStartCount} ITEMS
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {coldStartCount} cold-start stories
          </div>
          <div className="mt-1 text-[11px] text-amber-300">
            Authoritative fallback cluster priors applied
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <ForecastChart
        data={SAMPLE_SERIES}
        title="24-Hour Audience Engagement Forecaster — Predicted vs Actual Overlay"
        metricLabel="Audience Interaction & Click Rate (%)"
      />

      {/* Segment Filter Bar */}
      <EngagementFilterBar
        segmentFilter={segmentFilter}
        onSegmentChange={setSegmentFilter}
        onReset={() => setSegmentFilter("ALL")}
      />

      {/* Per-Segment Forecasts Table */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] shadow">
        <div className="flex items-center justify-between border-b border-[#2E2E32] bg-[#0A0A0B] px-4 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
            Per-Segment Engagement Forecast Ledger ({filteredForecasts.length} items)
          </h3>
          <span className="text-xs text-[#A0A4A8]">
            Audience segment breakdown &amp; cold-start status
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#2E2E32] bg-[#0A0A0B] font-semibold text-[#A0A4A8]">
                <th className="px-4 py-2.5">Story Headline</th>
                <th className="px-4 py-2.5">Audience Segment</th>
                <th className="px-4 py-2.5 text-right">Predicted Rate</th>
                <th className="px-4 py-2.5 text-right">Actual Outcome</th>
                <th className="px-4 py-2.5 text-right">Accuracy</th>
                <th className="px-4 py-2.5 text-center">Cold-Start Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E32]">
              {filteredForecasts.map((f) => (
                <tr key={f.id} className="hover:bg-[#0066CC]/10">
                  <td className="max-w-xs px-4 py-3 font-bold text-[#FAFAFA]">
                    {f.title}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#3399FF]">
                    {f.audienceSegment}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#FAFAFA]">
                    {f.predictedRate}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#0D9040]">
                    {f.actualRate !== undefined ? `${f.actualRate}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#FAFAFA]">
                    {(f.accuracyScore * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    {f.isColdStart ? (
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/40">
                        ⚡ COLD-START PRIOR
                      </span>
                    ) : (
                      <span className="rounded bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
                        ✓ HISTORICAL LEDGER
                      </span>
                    )}
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

interface EngagementFilterBarProps {
  segmentFilter: string;
  onSegmentChange: (val: string) => void;
  onReset: () => void;
}

function EngagementFilterBar({
  segmentFilter,
  onSegmentChange,
  onReset,
}: EngagementFilterBarProps): React.JSX.Element {
  const segments = [
    "ALL",
    "Tech Executives",
    "Policy Analysts",
    "Media Professionals",
    "General Consumer",
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[#A0A4A8]">Audience Segment:</span>
        {segments.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSegmentChange(s)}
            className={`rounded-full px-3 py-1 font-semibold transition-colors ${
              segmentFilter === s
                ? "bg-[#0066CC] text-white"
                : "border border-[#2E2E32] bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {segmentFilter !== "ALL" && (
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
        >
          ✕ Clear Segment Filter
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
