"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { AnomalyAlert } from "../components/anomaly-alert";
import { AnomalyAlertItem } from "../types";

const INITIAL_ANOMALIES: AnomalyAlertItem[] = [
  {
    id: "anom-01",
    type: "SPIKE",
    severity: "CRITICAL",
    affectedMetric: "Stage 3 Truth Verification Queue Depth (AGT-017–024)",
    baselineValue: 45,
    currentValue: 340,
    deviationPct: 655,
    consecutiveConfirmations: 3, // >= 2 confirmed
    isSuppressed: false,
    breakingNewsCorrelation:
      "Correlated with 6 independent C1 BREAKING wire reports regarding global compute infrastructure expansion.",
    detectedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "anom-02",
    type: "DIVERGENCE",
    severity: "HIGH",
    affectedMetric: "Virality MAPE Prediction vs Actual 6h Trajectory",
    baselineValue: 12000,
    currentValue: 34500,
    deviationPct: 187,
    consecutiveConfirmations: 2,
    isSuppressed: false,
    breakingNewsCorrelation:
      "Correlated with viral amplification on X/Twitter and LinkedIn Executive channels.",
    detectedAt: new Date(Date.now() - 42 * 60000).toISOString(),
  },
  {
    id: "anom-03",
    type: "DROP",
    severity: "MEDIUM",
    affectedMetric: "Reddit API Polling Connector Ingestion Volume",
    baselineValue: 920,
    currentValue: 310,
    deviationPct: -66,
    consecutiveConfirmations: 2,
    isSuppressed: false,
    detectedAt: new Date(Date.now() - 110 * 60000).toISOString(),
  },
  {
    id: "anom-04",
    type: "EMERGENCE",
    severity: "LOW",
    affectedMetric: "New Synthetic Multimedia Signature Cluster (#deep-audio-v2)",
    baselineValue: 0,
    currentValue: 18,
    deviationPct: 100,
    consecutiveConfirmations: 1, // 1/2 confirmations -> SUPPRESSED
    isSuppressed: true,
    detectedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
];

export default function AnomalyDetectionPage(): React.JSX.Element {
  const [anomalies, setAnomalies] = useState<AnomalyAlertItem[]>(INITIAL_ANOMALIES);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchAnomalies() {
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
          setError(resp.error?.message || "Failed to load anomaly alerts from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnomalies();
  }, []);

  const handleConfirmAlert = (id: string) => {
    setAnomalies(
      anomalies.map((a) =>
        a.id === id ? { ...a, isSuppressed: false, consecutiveConfirmations: 2 } : a,
      ),
    );
    alert(`Anomaly ${id} manually confirmed! Active alert generated.`);
  };

  const handleSuppressAlert = (id: string) => {
    setAnomalies(
      anomalies.map((a) =>
        a.id === id ? { ...a, isSuppressed: true } : a,
      ),
    );
    alert(`Anomaly ${id} suppressed from active notification ledger.`);
  };

  const activeCount = anomalies.filter((a) => !a.isSuppressed).length;
  const suppressedCount = anomalies.filter((a) => a.isSuppressed).length;
  const breakingCorrCount = anomalies.filter((a) => a.breakingNewsCorrelation).length;

  const filteredAnomalies = anomalies.filter((a) => {
    if (typeFilter !== "ALL" && a.type !== typeFilter) {
      return false;
    }
    if (severityFilter !== "ALL" && a.severity !== severityFilter) {
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg bg-[#12121A]" />
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">PRED-005 Anomaly Detector</h2>
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
            PRED-005 Telemetry Retrieval Failed
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
    (!isLoading && filteredAnomalies.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              PRED-005 Anomaly Detector &amp; False Positive Guard
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              SPIKE, DROP, DIVERGENCE, and EMERGENCE detection requiring 2+ consecutive confirmations
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter bar visible */}
        <AnomalyFilterBar
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          severityFilter={severityFilter}
          onSeverityChange={setSeverityFilter}
          onReset={() => {
            setTypeFilter("ALL");
            setSeverityFilter("ALL");
          }}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No anomalies match your filter criteria
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {typeFilter !== "ALL" || severityFilter !== "ALL"
              ? "Zero anomaly records match your active type or severity filter."
              : "Zero operational or metric anomalies are currently active. All 32 agents and pipeline queues are operating nominally."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setTypeFilter("ALL");
                setSeverityFilter("ALL");
                setAnomalies(INITIAL_ANOMALIES);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Reset Filters &amp; Load Ledger
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
            PRED-005 Anomaly Detector ({filteredAnomalies.length} tracked records)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative detection across SPIKE, DROP, DIVERGENCE, and EMERGENCE with 2+ consecutive confirmation guard
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="rounded bg-[#0A0A0B] px-3 py-1 font-mono text-xs font-bold text-[#0D9040] border border-[#2E2E32]">
            PRED-005 v2.0.0 — Zero False Positives
          </span>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* STAT CARDS (3 columns) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Active Confirmed Anomalies
            </span>
            <span className="rounded-full bg-[#CF2020]/20 px-2 py-0.5 text-[10px] font-bold text-[#CF2020]">
              PRED-005
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {activeCount} active <span className="text-xs font-normal text-[#CF2020]">(2+ confirmed)</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Alerts verified across 2+ consecutive intervals
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              False Positive Suppression
            </span>
            <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              GUARD ACTIVE
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9040]">
            14 false alarms <span className="text-xs font-normal text-[#A0A4A8]">suppressed</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            {suppressedCount} currently suppressed in 1/2 state
          </div>
        </div>

        <div className="rounded-lg border border-[#0066CC]/30 bg-[#0066CC]/10 p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3399FF]">
              AGT-009 Breaking News Correlation
            </span>
            <span className="rounded-full bg-[#0066CC] px-2 py-0.5 text-[10px] font-bold text-white">
              {breakingCorrCount} LINKED
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {breakingCorrCount} alerts correlated
          </div>
          <div className="mt-1 text-[11px] text-[#3399FF]">
            Linked to verified breaking news alerts
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <AnomalyFilterBar
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        severityFilter={severityFilter}
        onSeverityChange={setSeverityFilter}
        onReset={() => {
          setTypeFilter("ALL");
          setSeverityFilter("ALL");
        }}
      />

      {/* Anomaly Alerts Ledger */}
      <div className="space-y-4">
        {filteredAnomalies.map((a) => (
          <AnomalyAlert
            key={a.id}
            alert={a}
            onConfirmAlert={handleConfirmAlert}
            onSuppressAlert={handleSuppressAlert}
          />
        ))}
      </div>
    </div>
  );
}

interface AnomalyFilterBarProps {
  typeFilter: string;
  onTypeChange: (val: string) => void;
  severityFilter: string;
  onSeverityChange: (val: string) => void;
  onReset: () => void;
}

function AnomalyFilterBar({
  typeFilter,
  onTypeChange,
  severityFilter,
  onSeverityChange,
  onReset,
}: AnomalyFilterBarProps): React.JSX.Element {
  const isFiltered = typeFilter !== "ALL" || severityFilter !== "ALL";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Type Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Types</option>
            <option value="SPIKE">SPIKE</option>
            <option value="DROP">DROP</option>
            <option value="DIVERGENCE">DIVERGENCE</option>
            <option value="EMERGENCE">EMERGENCE</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Severity:</label>
          <select
            value={severityFilter}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
        >
          ✕ Clear Filters
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
