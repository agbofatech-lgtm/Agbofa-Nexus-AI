"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { AgentCard } from "../components/agent-card";
import { AgentGrid } from "../components/agent-grid";
import { PipelineAgentItem } from "./types";

const INITIAL_8_PIPELINES: PipelineAgentItem[] = [
  {
    agentId: "AGT-025",
    name: "Content Ingestion Orchestrator",
    type: "INGESTION_ORCHESTRATOR",
    squad: "PIPELINE",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 100.0,
    lastHealthCheck: new Date(Date.now() - 3 * 60000).toISOString(),
    itemsProcessed24h: 114850,
    avgLatencyMs: 45,
    primaryMetricLabel: "Items Routed",
    primaryMetricValue: "114,850 routed (3 tiers)",
  },
  {
    agentId: "AGT-026",
    name: "Story Graph Updater Agent",
    type: "STORY_GRAPH_UPDATER",
    squad: "PIPELINE",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.99,
    lastHealthCheck: new Date(Date.now() - 6 * 60000).toISOString(),
    itemsProcessed24h: 42800,
    avgLatencyMs: 65,
    primaryMetricLabel: "Node Ops (24h)",
    primaryMetricValue: "42,800 nodes (340 merges)",
  },
  {
    agentId: "AGT-027",
    name: "Factory Intake Router Agent",
    type: "FACTORY_INTAKE_ROUTER",
    squad: "PIPELINE",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.98,
    lastHealthCheck: new Date(Date.now() - 10 * 60000).toISOString(),
    itemsProcessed24h: 42100,
    avgLatencyMs: 120,
    primaryMetricLabel: "Packages Routed",
    primaryMetricValue: "42,100 pkgs (6 types)",
  },
  {
    agentId: "AGT-028",
    name: "Compliance Pre-Checker Gatekeeper",
    type: "COMPLIANCE_PRE_CHECKER",
    squad: "PIPELINE",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 100.0,
    lastHealthCheck: new Date(Date.now() - 15 * 60000).toISOString(),
    itemsProcessed24h: 42100,
    avgLatencyMs: 18,
    primaryMetricLabel: "Compliance Checks",
    primaryMetricValue: "96.2% CLEARED · 0 blocked",
  },
  {
    agentId: "AGT-029",
    name: "Distribution Scheduler Agent",
    type: "DISTRIBUTION_SCHEDULER",
    squad: "PIPELINE",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.99,
    lastHealthCheck: new Date(Date.now() - 20 * 60000).toISOString(),
    itemsProcessed24h: 42100,
    avgLatencyMs: 51,
    primaryMetricLabel: "Scheduled Drops",
    primaryMetricValue: "42,100 scheduled (8 plts)",
  },
  {
    agentId: "AGT-030",
    name: "Analytics Engagement Telemetry Collector",
    type: "ANALYTICS_COLLECTOR",
    squad: "PIPELINE",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.98,
    lastHealthCheck: new Date(Date.now() - 25 * 60000).toISOString(),
    itemsProcessed24h: 248000,
    avgLatencyMs: 42,
    primaryMetricLabel: "Metrics Ingested",
    primaryMetricValue: "248k events (0 anomalies)",
  },
  {
    agentId: "AGT-031",
    name: "Learning Feedback Loop Agent",
    type: "LEARNING_FEEDBACK_LOOP",
    squad: "PIPELINE",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 99.97,
    lastHealthCheck: new Date(Date.now() - 30 * 60000).toISOString(),
    itemsProcessed24h: 24,
    avgLatencyMs: 210,
    primaryMetricLabel: "Models Updated",
    primaryMetricValue: "24 models updated ▲ +15%",
  },
  {
    agentId: "AGT-032",
    name: "Operations Monitor Meta-Agent",
    type: "OPERATIONS_MONITOR",
    squad: "PIPELINE",
    status: "HEALTHY",
    version: "1.0.0",
    uptime: 100.0,
    lastHealthCheck: new Date(Date.now() - 35 * 60000).toISOString(),
    itemsProcessed24h: 32,
    avgLatencyMs: 15,
    primaryMetricLabel: "Fleet Matrix Health",
    primaryMetricValue: "32/32 agents nominal",
  },
];

export default function PipelineSquadOverviewPage(): React.JSX.Element {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<PipelineAgentItem[]>(
    INITIAL_8_PIPELINES,
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("name");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchPipelines() {
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
            resp.error?.message ||
              "Failed to load pipeline squad telemetry from BFF.",
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
    fetchPipelines();
  }, []);

  const totalItems24h = pipelines.reduce(
    (acc, p) => acc + p.itemsProcessed24h,
    0,
  );
  const throughputRate = Math.round(totalItems24h / 24);
  const avgUptime = (
    pipelines.reduce((acc, p) => acc + p.uptime, 0) / (pipelines.length || 1)
  ).toFixed(2);

  const filteredPipelines = pipelines
    .filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "throughput") return b.itemsProcessed24h - a.itemsProcessed24h;
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">Pipeline Agents</h2>
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
            Pipeline Squad Retrieval Failed
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
            Retry Squad Retrieval
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (
    simulateMode === "empty" ||
    (!isLoading && filteredPipelines.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              Pipeline Agents (AGT-025–032)
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              8 agents orchestrating content from ingestion to analytics and closed-loop feedback
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter bar visible */}
        <PipelineFilterBar
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
            No pipeline agents match your filter criteria
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {statusFilter !== "ALL"
              ? `Zero pipeline agents match status filter '${statusFilter}'. Try switching to 'All Statuses'.`
              : "Zero pipeline agents are currently active in the telemetry ledger."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setStatusFilter("ALL");
                setSortBy("name");
                setPipelines(INITIAL_8_PIPELINES);
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
            Pipeline Agents — AGT-025 through AGT-032 ({filteredPipelines.length} shown)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            8 specialized AI agents orchestrating content ingestion, story graph updates, factory packaging, AGT-028 compliance, multi-channel distribution, analytics, and meta-monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setPipelines(INITIAL_8_PIPELINES)}
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
              Total Items Processed (24h)
            </span>
            <span className="rounded-full bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF]">
              LIVE
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {totalItems24h.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Throughput rate: {throughputRate.toLocaleString()} items/hour
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Pipeline Overall Health
            </span>
            <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              OPTIMAL
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9040]">
            FLOWING
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            End-to-end signal velocity nominal
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Active Pipeline Squad Uptime
            </span>
            <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              8 / 8 ACTIVE
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {avgUptime}%
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            All 8 pipeline agents nominal
          </div>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <PipelineFilterBar
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
        agents={filteredPipelines}
        renderAgent={(ag) => (
          <AgentCard
            key={ag.agentId}
            agent={ag}
            onClick={() =>
              router.push(`/agents/pipeline/${ag.agentId.toLowerCase()}`)
            }
          />
        )}
      />
    </div>
  );
}

interface PipelineFilterBarProps {
  statusFilter: string;
  onStatusChange: (val: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  onReset: () => void;
}

function PipelineFilterBar({
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  onReset,
}: PipelineFilterBarProps): React.JSX.Element {
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
            <option value="throughput">Throughput / Items Processed (Desc)</option>
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
