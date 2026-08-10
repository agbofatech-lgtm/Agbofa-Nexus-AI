"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { ForecastChart } from "../components/forecast-chart";
import { PublishingTimeItem, ForecastSeriesPoint } from "../types";

const INITIAL_PUBLISHING_ITEMS: PublishingTimeItem[] = [
  {
    platform: "Twitter/X",
    optimalDay: "Tuesday",
    optimalHourUtc: "14:00 UTC",
    predictedEngagementRate: 6.8,
    breakingOverrideCount: 18,
    embargoScheduledCount: 420,
  },
  {
    platform: "LinkedIn",
    optimalDay: "Wednesday",
    optimalHourUtc: "09:00 UTC",
    predictedEngagementRate: 8.4,
    breakingOverrideCount: 4,
    embargoScheduledCount: 310,
  },
  {
    platform: "Facebook",
    optimalDay: "Thursday",
    optimalHourUtc: "18:00 UTC",
    predictedEngagementRate: 4.2,
    breakingOverrideCount: 12,
    embargoScheduledCount: 190,
  },
  {
    platform: "Instagram",
    optimalDay: "Friday",
    optimalHourUtc: "16:00 UTC",
    predictedEngagementRate: 7.1,
    breakingOverrideCount: 6,
    embargoScheduledCount: 180,
  },
  {
    platform: "YouTube",
    optimalDay: "Saturday",
    optimalHourUtc: "15:00 UTC",
    predictedEngagementRate: 9.8,
    breakingOverrideCount: 2,
    embargoScheduledCount: 45,
  },
  {
    platform: "Reddit",
    optimalDay: "Monday",
    optimalHourUtc: "13:00 UTC",
    predictedEngagementRate: 5.5,
    breakingOverrideCount: 8,
    embargoScheduledCount: 35,
  },
  {
    platform: "RSS",
    optimalDay: "Continuous",
    optimalHourUtc: "Immediate / 00:00 UTC",
    predictedEngagementRate: 3.8,
    breakingOverrideCount: 52,
    embargoScheduledCount: 20,
  },
];

const SAMPLE_HOURLY_ENGAGEMENT: ForecastSeriesPoint[] = [
  { time: "00:00", predicted: 2.1, actual: 2.0, upperBound: 2.8, lowerBound: 1.5 },
  { time: "04:00", predicted: 3.4, actual: 3.5, upperBound: 4.2, lowerBound: 2.6 },
  { time: "08:00", predicted: 6.2, actual: 6.0, upperBound: 7.1, lowerBound: 5.3 },
  { time: "12:00", predicted: 8.8, actual: 9.1, upperBound: 9.8, lowerBound: 7.9 },
  { time: "14:00 (Peak)", predicted: 9.6, actual: 9.8, upperBound: 10.5, lowerBound: 8.8 },
  { time: "18:00", predicted: 7.4, actual: 7.2, upperBound: 8.3, lowerBound: 6.5 },
  { time: "22:00", predicted: 4.0, actual: 4.1, upperBound: 4.9, lowerBound: 3.1 },
];

export default function PublishingTimePredictionsPage(): React.JSX.Element {
  const [publishingItems, setPublishingItems] = useState<PublishingTimeItem[]>(
    INITIAL_PUBLISHING_ITEMS,
  );
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchPublishingTimes() {
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
              "Failed to load publishing time forecasts from BFF.",
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
    fetchPublishingTimes();
  }, []);

  const totalOverrides = publishingItems.reduce(
    (acc, item) => acc + item.breakingOverrideCount,
    0,
  );
  const totalEmbargoes = publishingItems.reduce(
    (acc, item) => acc + item.embargoScheduledCount,
    0,
  );

  const filteredItems = publishingItems.filter((item) => {
    if (platformFilter !== "ALL" && item.platform !== platformFilter) {
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-[#12121A]" />
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">PRED-006 Publishing Time</h2>
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
            PRED-006 Telemetry Retrieval Failed
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
    (!isLoading && filteredItems.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              PRED-006 Publishing Time Predictor
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              Optimal publishing windows per platform with breaking news overrides
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter bar visible */}
        <PublishingFilterBar
          platformFilter={platformFilter}
          onPlatformChange={setPlatformFilter}
          onReset={() => setPlatformFilter("ALL")}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No publishing predictions match your platform filter
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {platformFilter !== "ALL"
              ? `Zero publishing windows match platform '${platformFilter}'. Try switching to 'All Platforms'.`
              : "Zero optimal publishing windows are currently active in the ledger."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setPlatformFilter("ALL");
                setPublishingItems(INITIAL_PUBLISHING_ITEMS);
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
            PRED-006 Publishing Time Predictor ({filteredItems.length} platforms tracked)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Optimal publication window forecasting, breaking news immediate overrides, and embargo release synchronization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="rounded bg-[#0A0A0B] px-3 py-1 font-mono text-xs font-bold text-[#3399FF] border border-[#2E2E32]">
            PRED-006 v2.0.0 — Synchronized
          </span>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* STAT CARDS (2 columns) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#CF2020]/40 bg-[#CF2020]/10 p-5 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#CF2020]">
              Breaking News Immediate Overrides
            </span>
            <span className="rounded-full bg-[#CF2020] px-2.5 py-0.5 text-[10px] font-bold text-white">
              C1 PRIORITY
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {totalOverrides} immediate overrides
          </div>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            C1 Breaking signals bypass scheduled publishing windows and dispatch immediately across all platforms.
          </p>
        </div>

        <div className="rounded-lg border border-[#0D9040]/40 bg-[#0D9040]/10 p-5 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9040]">
              Embargo-Aware Scheduling Ledger
            </span>
            <span className="rounded-full bg-[#0D9040] px-2.5 py-0.5 text-[10px] font-bold text-white">
              SYNCHRONIZED
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {totalEmbargoes.toLocaleString()} embargo releases
          </div>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            Embargoed packages automatically hold publication until statutory release timestamp, then release at optimal window.
          </p>
        </div>
      </div>

      {/* Forecast Chart: 24h Hourly Engagement Curve */}
      <ForecastChart
        data={SAMPLE_HOURLY_ENGAGEMENT}
        title="PRED-006 24-Hour Engagement Curve by Hour (UTC) — Optimal Window at 14:00 UTC"
        metricLabel="Predicted vs Actual Engagement Lift (%)"
      />

      {/* Platform Filter Bar */}
      <PublishingFilterBar
        platformFilter={platformFilter}
        onPlatformChange={setPlatformFilter}
        onReset={() => setPlatformFilter("ALL")}
      />

      {/* Per-Platform Optimal Time Table */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] shadow">
        <div className="flex items-center justify-between border-b border-[#2E2E32] bg-[#0A0A0B] px-4 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
            Authoritative Optimal Publishing Window Ledger ({filteredItems.length} platforms)
          </h3>
          <span className="text-xs text-[#A0A4A8]">
            Engagement peak forecasts per platform
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#2E2E32] bg-[#0A0A0B] font-semibold text-[#A0A4A8]">
                <th className="px-4 py-2.5">Target Platform</th>
                <th className="px-4 py-2.5">Optimal Day</th>
                <th className="px-4 py-2.5">Optimal Hour (UTC)</th>
                <th className="px-4 py-2.5 text-right">Predicted Engagement Rate</th>
                <th className="px-4 py-2.5 text-right">Breaking Overrides</th>
                <th className="px-4 py-2.5 text-right">Embargoes Scheduled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E32]">
              {filteredItems.map((item) => (
                <tr key={item.platform} className="hover:bg-[#0066CC]/10">
                  <td className="px-4 py-3 font-bold text-[#FAFAFA]">
                    {item.platform}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#3399FF]">
                    {item.optimalDay}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-[#0D9040]">
                    {item.optimalHourUtc}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#FAFAFA]">
                    {item.predictedEngagementRate}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#CF2020]">
                    {item.breakingOverrideCount} overrides
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#0D9040]">
                    {item.embargoScheduledCount.toLocaleString()} pkgs
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

interface PublishingFilterBarProps {
  platformFilter: string;
  onPlatformChange: (val: string) => void;
  onReset: () => void;
}

function PublishingFilterBar({
  platformFilter,
  onPlatformChange,
  onReset,
}: PublishingFilterBarProps): React.JSX.Element {
  const platforms = [
    "ALL",
    "Twitter/X",
    "LinkedIn",
    "Facebook",
    "Instagram",
    "YouTube",
    "Reddit",
    "RSS",
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[#A0A4A8]">Platform:</span>
        {platforms.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPlatformChange(p)}
            className={`rounded-full px-3 py-1 font-semibold transition-colors ${
              platformFilter === p
                ? "bg-[#0066CC] text-white"
                : "border border-[#2E2E32] bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {platformFilter !== "ALL" && (
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
        >
          ✕ Clear Platform Filter
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
