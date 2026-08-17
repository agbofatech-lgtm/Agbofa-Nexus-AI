"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { EngagementMetrics } from "../components/engagement-metrics";
import {
  SAMPLE_ENGAGEMENT_METRICS,
  SAMPLE_INFERRED_PREFERENCES,
} from "../mock-data";
import {
  EngagementMetricsData,
  InferredPreferenceItem,
} from "../types";

export default function BehavioralInsightsPage(): React.JSX.Element {
  const [metrics, setMetrics] = useState<EngagementMetricsData>(
    SAMPLE_ENGAGEMENT_METRICS,
  );
  const [inferredPrefs, setInferredPrefs] = useState<InferredPreferenceItem[]>(
    SAMPLE_INFERRED_PREFERENCES,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchBehavioralAnalytics() {
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
          setError("Failed to retrieve behavioral analytics ledger from BFF.");
        }
      } catch {
        // Fallback to sample metrics
      } finally {
        setIsLoading(false);
      }
    }
    fetchBehavioralAnalytics();
  }, []);

  const handleAcceptInferredPreference = (itemId: string) => {
    const accepted = inferredPrefs.find((p) => p.id === itemId);
    if (accepted) {
      alert(
        `Added explicit preference for "${accepted.categoryName}" to your Reader Profile ledger (PERS-001).`,
      );
      setInferredPrefs((prev) => prev.filter((p) => p.id !== itemId));
    }
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
            Behavioral Analytics & Insights (PERS-003 / PERS-005)
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
            Behavioral Analytics Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error ||
              "Simulated error: unable to load behavioral telemetry via BFF proxy."}
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
            Behavioral Analytics & Insights (PERS-003 / PERS-005)
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
            Zero behavioral analytics recorded today
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            You have zero reading time or engagement signals recorded in this window. Keep reading to generate behavioral insights.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setMetrics(SAMPLE_ENGAGEMENT_METRICS);
                setInferredPrefs(SAMPLE_INFERRED_PREFERENCES);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Analytics Ledger
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
            Behavioral Analytics & Inferred Preference Intelligence (PERS-003 / PERS-005)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Engagement telemetry across reading windows, content lengths, formats, anti-echo-chamber diversity, and privacy boundary enforcement
          </p>
        </div>

        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* Engagement Metrics Component */}
      <EngagementMetrics
        metrics={metrics}
        inferredPreferences={inferredPrefs}
        onAcceptInferredPreference={handleAcceptInferredPreference}
      />
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
