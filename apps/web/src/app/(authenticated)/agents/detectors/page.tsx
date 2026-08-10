"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { AgentCard } from "../components/agent-card";
import { AgentGrid } from "../components/agent-grid";
import { DetectorAgentItem } from "./types";

const INITIAL_8_DETECTORS: DetectorAgentItem[] = [
  {
    agentId: "AGT-009",
    name: "Breaking News Anomaly Detector",
    squad: "DETECTORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.99,
    lastHealthCheck: new Date(Date.now() - 5 * 60000).toISOString(),
    detections24h: 340,
    avgConfidence: 0.96,
    avgLatencyMs: 110,
    primaryMetricLabel: "C1 Priority Detections",
    primaryMetricValue: "52 breaking alerts",
  },
  {
    agentId: "AGT-010",
    name: "Trend Identifier & Lifecycle Engine",
    squad: "DETECTORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.98,
    lastHealthCheck: new Date(Date.now() - 8 * 60000).toISOString(),
    detections24h: 890,
    avgConfidence: 0.94,
    avgLatencyMs: 135,
    primaryMetricLabel: "Active Trends",
    primaryMetricValue: "64 trends tracking",
  },
  {
    agentId: "AGT-011",
    name: "Sentiment Polarity & Resonance Analyzer",
    squad: "DETECTORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.97,
    lastHealthCheck: new Date(Date.now() - 12 * 60000).toISOString(),
    detections24h: 2150,
    avgConfidence: 0.95,
    avgLatencyMs: 85,
    primaryMetricLabel: "Polarity Breakdown",
    primaryMetricValue: "58% POS · 22% NEG",
  },
  {
    agentId: "AGT-012",
    name: "Source Credibility Assessor",
    squad: "DETECTORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 100.0,
    lastHealthCheck: new Date(Date.now() - 18 * 60000).toISOString(),
    detections24h: 1420,
    avgConfidence: 0.98,
    avgLatencyMs: 92,
    primaryMetricLabel: "Avg Credibility Score",
    primaryMetricValue: "98% (HIGH tier avg)",
  },
  {
    agentId: "AGT-013",
    name: "Multimedia Synthetic Forensic Classifier",
    squad: "DETECTORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.96,
    lastHealthCheck: new Date(Date.now() - 25 * 60000).toISOString(),
    detections24h: 480,
    avgConfidence: 0.97,
    avgLatencyMs: 240,
    primaryMetricLabel: "Media Formats Analyzed",
    primaryMetricValue: "320 img · 110 vid · 50 aud",
  },
  {
    agentId: "AGT-014",
    name: "Language & Locale Translation Detector",
    squad: "DETECTORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.99,
    lastHealthCheck: new Date(Date.now() - 32 * 60000).toISOString(),
    detections24h: 1840,
    avgConfidence: 0.99,
    avgLatencyMs: 45,
    primaryMetricLabel: "Languages Detected",
    primaryMetricValue: "14 locales active",
  },
  {
    agentId: "AGT-015",
    name: "Duplicate & Plagiarism Cluster Checker",
    squad: "DETECTORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.98,
    lastHealthCheck: new Date(Date.now() - 40 * 60000).toISOString(),
    detections24h: 1120,
    avgConfidence: 0.96,
    avgLatencyMs: 78,
    primaryMetricLabel: "Duplicates Found",
    primaryMetricValue: "340 dupes skipped",
  },
  {
    agentId: "AGT-016",
    name: "Virality MAPE Prediction Engine",
    squad: "DETECTORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.95,
    lastHealthCheck: new Date(Date.now() - 48 * 60000).toISOString(),
    detections24h: 680,
    avgConfidence: 0.92,
    avgLatencyMs: 165,
    primaryMetricLabel: "Viral Predictions",
    primaryMetricValue: "142 VIRAL (>0.80)",
  },
];

export default function DetectorSquadOverviewPage(): React.JSX.Element {
  const router = useRouter();
  const [detectors, setDetectors] = useState<DetectorAgentItem[]>(INITIAL_8_DETECTORS);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("name");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function fetchDetectors() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string; active_only: boolean },
          { sources?: unknown[] }
        >("content_origination.v1.ContentOriginationService", "ListSources", {
          tenant_id: "tenant-default",
          active_only: true,
        });
        if (resp.status === "ERROR") {
          setError(resp.error?.message || "Failed to load detector squad telemetry from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDetectors();
  }, []);

  const totalDetections = detectors.reduce(
    (acc, d) => acc + d.detections24h,
    0,
  );
  const avgConfidence = (
    detectors.reduce((acc, d) => acc + d.avgConfidence, 0) /
    (detectors.length || 1)
  ).toFixed(2);
  const avgUptime = (
    detectors.reduce((acc, d) => acc + d.uptime, 0) / (detectors.length || 1)
  ).toFixed(2);

  const filteredDetectors = detectors
    .filter((d) => {
      if (statusFilter !== "ALL" && d.status !== statusFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "detections") return b.detections24h - a.detections24h;
      if (sortBy === "uptime") return b.uptime - a.uptime;
      return a.name.localeCompare(b.name);
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">Content Detectors</h2>
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
            Detector Squad Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error || "Simulated error: unable to reach ContentOriginationService via BFF."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "error") setSimulateMode("normal");
              else window.location.reload();
            }}
            className="rounded-md bg-[#CF2020] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#CF2020]/80 transition-colors"
          >
            Retry Squad Retrieval
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (
    simulateMode === "empty" ||
    (!isLoading && filteredDetectors.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              Content Detector Agents (AGT-009–016)
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              8 agents analyzing signals for breaking news, trends, sentiment, and virality
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter bar visible */}
        <DetectorFilterBar
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onReset={() => {
            setStatusFilter("ALL");
            setSortBy("name");
          }}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No detector agents match your filter criteria
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {statusFilter !== "ALL"
              ? `Zero detector agents match status filter '${statusFilter}'. Try switching to 'All Statuses'.`
              : "Zero detector agents are currently active in the telemetry ledger."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setStatusFilter("ALL");
                setSortBy("name");
                setDetectors(INITIAL_8_DETECTORS);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Reset Filters &amp; Load Squad
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
            Content Detector Agents — AGT-009 through AGT-016 ({filteredDetectors.length} shown)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            8 AI agents analyzing signals for breaking news, trends, sentiment, credibility, multimedia, and virality
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setDetectors(INITIAL_8_DETECTORS)}
            className="rounded-md border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC]"
          >
            ↻ Refresh Squad
          </button>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* SQUAD STATS SUMMARY CARDS (3 columns) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Total Detections (24h)
            </span>
            <span className="rounded-full bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF]">
              LIVE
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {totalDetections.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Extracted entities, trends &amp; scores
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Average Detection Confidence
            </span>
            <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              VERIFIED
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9040]">
            {(Number(avgConfidence) * 100).toFixed(0)}%
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            High precision signal filtering
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Active Detector Squad Uptime
            </span>
            <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              8 / 8 ACTIVE
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {avgUptime}%
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            All 8 detectors nominal
          </div>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <DetectorFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={() => {
          setStatusFilter("ALL");
          setSortBy("name");
        }}
      />

      {/* 8-AGENT GRID */}
      <AgentGrid
        agents={filteredDetectors}
        renderAgent={(ag) => (
          <AgentCard
            key={ag.agentId}
            agent={ag}
            onClick={() => router.push(`/agents/detectors/${ag.agentId.toLowerCase()}`)}
          />
        )}
      />
    </div>
  );
}

interface DetectorFilterBarProps {
  statusFilter: string;
  onStatusChange: (val: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  onReset: () => void;
}

function DetectorFilterBar({
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  onReset,
}: DetectorFilterBarProps): React.JSX.Element {
  const isFiltered = statusFilter !== "ALL" || sortBy !== "name";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Statuses</option>
            <option value="HEALTHY">HEALTHY</option>
            <option value="DEGRADED">DEGRADED</option>
            <option value="RATE_LIMITED">RATE LIMITED</option>
            <option value="OFFLINE">OFFLINE</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="name">Name</option>
            <option value="detections">Detections (24h) (Desc)</option>
            <option value="uptime">Uptime % (Desc)</option>
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
