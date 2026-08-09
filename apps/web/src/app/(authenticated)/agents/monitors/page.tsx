"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { AgentCard } from "../components/agent-card";
import { AgentGrid } from "../components/agent-grid";
import { MonitorAgent } from "../types";

const INITIAL_8_MONITORS: MonitorAgent[] = [
  {
    agentId: "AGT-001",
    name: "X/Twitter Breaking Signal Monitor",
    squad: "MONITORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.98,
    lastHealthCheck: new Date(Date.now() - 5 * 60000).toISOString(),
    platform: "TWITTER",
    signalsDetected24h: 1450,
    avgFetchLatencyMs: 142,
    rateLimit: {
      used: 380,
      total: 500,
      resetTime: "14m 20s",
    },
    apiStatus: "CONNECTED",
  },
  {
    agentId: "AGT-002",
    name: "Facebook Community Signal Monitor",
    squad: "MONITORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.99,
    lastHealthCheck: new Date(Date.now() - 8 * 60000).toISOString(),
    platform: "FACEBOOK",
    signalsDetected24h: 820,
    avgFetchLatencyMs: 185,
    rateLimit: {
      used: 120,
      total: 300,
      resetTime: "25m 10s",
    },
    apiStatus: "CONNECTED",
  },
  {
    agentId: "AGT-003",
    name: "Instagram Visual Story Monitor",
    squad: "MONITORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.96,
    lastHealthCheck: new Date(Date.now() - 12 * 60000).toISOString(),
    platform: "INSTAGRAM",
    signalsDetected24h: 640,
    avgFetchLatencyMs: 210,
    rateLimit: {
      used: 180,
      total: 250,
      resetTime: "40m 00s",
    },
    apiStatus: "CONNECTED",
  },
  {
    agentId: "AGT-004",
    name: "TikTok Viral Trend Monitor",
    squad: "MONITORS",
    status: "RATE_LIMITED",
    version: "1.0.0",
    uptime: 98.4,
    lastHealthCheck: new Date(Date.now() - 18 * 60000).toISOString(),
    platform: "TIKTOK",
    signalsDetected24h: 1240,
    avgFetchLatencyMs: 310,
    rateLimit: {
      used: 480,
      total: 500,
      resetTime: "08m 45s",
    },
    apiStatus: "DEGRADED",
  },
  {
    agentId: "AGT-005",
    name: "LinkedIn Enterprise News Monitor",
    squad: "MONITORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.99,
    lastHealthCheck: new Date(Date.now() - 25 * 60000).toISOString(),
    platform: "LINKEDIN",
    signalsDetected24h: 390,
    avgFetchLatencyMs: 160,
    rateLimit: {
      used: 95,
      total: 200,
      resetTime: "32m 15s",
    },
    apiStatus: "CONNECTED",
  },
  {
    agentId: "AGT-006",
    name: "YouTube Video Broadcast Monitor",
    squad: "MONITORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.95,
    lastHealthCheck: new Date(Date.now() - 32 * 60000).toISOString(),
    platform: "YOUTUBE",
    signalsDetected24h: 510,
    avgFetchLatencyMs: 280,
    rateLimit: {
      used: 210,
      total: 400,
      resetTime: "50m 30s",
    },
    apiStatus: "CONNECTED",
  },
  {
    agentId: "AGT-007",
    name: "Reddit Tech & Community Monitor",
    squad: "MONITORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.97,
    lastHealthCheck: new Date(Date.now() - 40 * 60000).toISOString(),
    platform: "REDDIT",
    signalsDetected24h: 920,
    avgFetchLatencyMs: 130,
    rateLimit: {
      used: 140,
      total: 300,
      resetTime: "18m 10s",
    },
    apiStatus: "CONNECTED",
  },
  {
    agentId: "AGT-008",
    name: "RSS Wire Syndication & Emerging Monitor",
    squad: "MONITORS",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 100.0,
    lastHealthCheck: new Date(Date.now() - 48 * 60000).toISOString(),
    platform: "RSS",
    signalsDetected24h: 2180,
    avgFetchLatencyMs: 95,
    rateLimit: {
      used: 420,
      total: 1000,
      resetTime: "59m 50s",
    },
    apiStatus: "CONNECTED",
  },
];

export default function MonitorSquadOverviewPage(): React.JSX.Element {
  const router = useRouter();
  const [monitors, setMonitors] = useState<MonitorAgent[]>(INITIAL_8_MONITORS);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("name");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchMonitors() {
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
          setError(
            resp.error?.message || "Failed to load monitor telemetry from BFF.",
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
    fetchMonitors();
  }, []);

  const totalSignals24h = monitors.reduce(
    (acc, m) => acc + m.signalsDetected24h,
    0,
  );
  const avgUptime = (
    monitors.reduce((acc, m) => acc + m.uptime, 0) / (monitors.length || 1)
  ).toFixed(2);

  const filteredMonitors = monitors
    .filter((m) => {
      if (statusFilter !== "ALL" && m.status !== statusFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "signals") return b.signalsDetected24h - a.signalsDetected24h;
      if (sortBy === "uptime") return b.uptime - a.uptime;
      if (sortBy === "ratelimit") {
        const aPct = a.rateLimit.used / a.rateLimit.total;
        const bPct = b.rateLimit.used / b.rateLimit.total;
        return bPct - aPct;
      }
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">Platform Monitors</h2>
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
            Monitor Telemetry Retrieval Failed
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
    (!isLoading && filteredMonitors.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              Platform Monitor Agents (AGT-001–008)
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              8 agents monitoring social media platforms for breaking news and signals
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter bar visible */}
        <MonitorFilterBar
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
            No monitor agents match your filter criteria
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {statusFilter !== "ALL"
              ? `Zero monitor agents match status filter '${statusFilter}'. Try switching to 'All Statuses'.`
              : "Zero monitor agents are currently active in the telemetry ledger."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setStatusFilter("ALL");
                setSortBy("name");
                setMonitors(INITIAL_8_MONITORS);
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
            Platform Monitor Agents — AGT-001 through AGT-008 ({filteredMonitors.length} shown)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            8 specialized AI agents monitoring X/Twitter, Facebook, Instagram, TikTok, LinkedIn, YouTube, Reddit, and RSS
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setMonitors(INITIAL_8_MONITORS)}
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
              Total Ingested Signals (24h)
            </span>
            <span className="rounded-full bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF]">
              LIVE
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {totalSignals24h.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Continuous multi-channel signal feed
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Platforms Covered
            </span>
            <span className="rounded-full bg-[#6C5CE7]/20 px-2 py-0.5 text-[10px] font-bold text-[#6C5CE7]">
              8 ADAPTERS
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            8 / 8 Active
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Social &amp; RSS syndication connectors
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Average Squad Uptime
            </span>
            <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              HEALTHY
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9040]">
            {avgUptime}%
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            7 nominal · 1 rate-limit backoff
          </div>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <MonitorFilterBar
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
        agents={filteredMonitors}
        renderAgent={(ag) => {
          const ratePct = Math.round((ag.rateLimit.used / ag.rateLimit.total) * 100);
          return (
            <AgentCard
              key={ag.agentId}
              agent={{
                ...ag,
                primaryMetricLabel: "Signals (24h) & Rate Cap",
                primaryMetricValue: `${ag.signalsDetected24h.toLocaleString()} sig (${ratePct}% cap)`,
              }}
              onClick={() => router.push(`/agents/monitors/${ag.agentId.toLowerCase()}`)}
            />
          );
        }}
      />
    </div>
  );
}

interface MonitorFilterBarProps {
  statusFilter: string;
  onStatusChange: (val: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  onReset: () => void;
}

function MonitorFilterBar({
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  onReset,
}: MonitorFilterBarProps): React.JSX.Element {
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
            <option value="AUTH_FAILED">AUTH FAILED</option>
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
            <option value="signals">Signals Detected (Desc)</option>
            <option value="uptime">Uptime % (Desc)</option>
            <option value="ratelimit">Rate Limit % (Desc)</option>
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
