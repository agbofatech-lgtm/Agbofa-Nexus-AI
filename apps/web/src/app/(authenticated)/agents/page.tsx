"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../lib/bff/client";
import { AgentCard } from "./components/agent-card";
import { AgentGrid } from "./components/agent-grid";
import {
  AgentBase,
  AgentSquadType,
  AgentHealthStatusType,
} from "./types";

interface FleetOverviewAgent extends AgentBase {
  platform?: string;
  primaryMetricLabel?: string;
  primaryMetricValue?: string | number;
}

function build32FleetOverview(): FleetOverviewAgent[] {
  const monitorNames = [
    { name: "X/Twitter Monitor", platform: "TWITTER", signals: 1450 },
    { name: "Facebook Monitor", platform: "FACEBOOK", signals: 820 },
    { name: "Instagram Monitor", platform: "INSTAGRAM", signals: 640 },
    { name: "TikTok Monitor", platform: "TIKTOK", signals: 1240 },
    { name: "LinkedIn Monitor", platform: "LINKEDIN", signals: 390 },
    { name: "YouTube Monitor", platform: "YOUTUBE", signals: 510 },
    { name: "Reddit Monitor", platform: "REDDIT", signals: 920 },
    { name: "RSS/Emerging Monitor", platform: "RSS", signals: 2180 },
  ];

  const detectorNames = [
    { name: "Breaking News Anomaly Detector", metric: "42 anomalies/24h" },
    { name: "Duplicate Signal Cluster Checker", metric: "98% deduplication" },
    { name: "Language & Translation Detector", metric: "14 languages" },
    { name: "Multimedia Synthetic Forensic Classifier", metric: "0.98 accuracy" },
    { name: "Factual Claim Extraction Detector", metric: "340 claims/hr" },
    { name: "Sentiment Polarity & Resonance Analyzer", metric: "0.94 F1 score" },
    { name: "Commercial Promotion Bias Detector", metric: "12 flags today" },
    { name: "Virality MAPE Prediction Engine", metric: "4.2% MAPE" },
  ];

  const verificationNames = [
    { name: "Authoritative Fact-Check Verifier", metric: "240 verdicts/24h" },
    { name: "Cross-Reference Corroboration Engine", metric: "4.2 sources/claim" },
    { name: "Source Credibility Assessment Ledger", metric: "98% reliability" },
    { name: "Extracted Factual Claim Validator", metric: "0.99 confidence" },
    { name: "Misinformation Risk Profile Classifier", metric: "0 high-risk today" },
    { name: "Editorial Bias Severity Assessor", metric: "NONE bias avg" },
    { name: "Verification Confidence Breakdown Engine", metric: "30/25/20/15/10" },
    { name: "Cross-Media Consistency Verifier", metric: "99.2% alignment" },
  ];

  const pipelineNames = [
    { name: "Content Ingestion Orchestration Agent", metric: "4,850 signals/hr" },
    { name: "Package Assembly & Format Generator", metric: "6 formats ready" },
    { name: "Brand Voice Tone Compatibility Engine", metric: "0.96 tone score" },
    { name: "AGT-028 Compliance Gatekeeper", metric: "0 block events" },
    { name: "Distribution Schedule Orchestrator", metric: "23 published" },
    { name: "Audience Personalization Router", metric: "5-factor ranking" },
    { name: "Analytics Engagement Telemetry Collector", metric: "48k events/day" },
    { name: "RLS Tenant Boundary Governance Watchdog", metric: "0 leaks/24h" },
  ];

  const all: FleetOverviewAgent[] = [];

  monitorNames.forEach((item, idx) => {
    const numStr = (idx + 1).toString().padStart(3, "0");
    all.push({
      agentId: `AGT-${numStr}`,
      name: item.name,
      squad: "MONITORS",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.98,
      lastHealthCheck: new Date(Date.now() - idx * 60000).toISOString(),
      platform: item.platform,
      primaryMetricLabel: "Signals (24h)",
      primaryMetricValue: item.signals.toLocaleString(),
    });
  });

  detectorNames.forEach((item, idx) => {
    const numStr = (idx + 9).toString().padStart(3, "0");
    all.push({
      agentId: `AGT-${numStr}`,
      name: item.name,
      squad: "DETECTORS",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.99,
      lastHealthCheck: new Date(Date.now() - idx * 60000).toISOString(),
      primaryMetricLabel: "Performance",
      primaryMetricValue: item.metric,
    });
  });

  verificationNames.forEach((item, idx) => {
    const numStr = (idx + 17).toString().padStart(3, "0");
    all.push({
      agentId: `AGT-${numStr}`,
      name: item.name,
      squad: "VERIFICATION",
      status: idx === 0 ? "RATE_LIMITED" : "HEALTHY",
      version: "1.0.0",
      uptime: 99.96,
      lastHealthCheck: new Date(Date.now() - idx * 60000).toISOString(),
      primaryMetricLabel: "Audit Metric",
      primaryMetricValue: item.metric,
    });
  });

  pipelineNames.forEach((item, idx) => {
    const numStr = (idx + 25).toString().padStart(3, "0");
    all.push({
      agentId: `AGT-${numStr}`,
      name: item.name,
      squad: "PIPELINE",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 100.0,
      lastHealthCheck: new Date(Date.now() - idx * 60000).toISOString(),
      primaryMetricLabel: "Throughput",
      primaryMetricValue: item.metric,
    });
  });

  return all;
}

const INITIAL_FLEET = build32FleetOverview();

export default function AgentFleetOverviewPage(): React.JSX.Element {
  const router = useRouter();
  const [agents, setAgents] = useState<FleetOverviewAgent[]>(INITIAL_FLEET);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [squadFilter, setSquadFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("id");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchFleet() {
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
          setError(resp.error?.message || "Failed to load agent fleet telemetry from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFleet();
  }, []);

  const handleAgentClick = (agent: FleetOverviewAgent) => {
    if (agent.squad === "MONITORS") {
      const idLower = agent.agentId.toLowerCase();
      router.push(`/agents/monitors/${idLower}`);
    } else if (agent.squad === "DETECTORS") {
      const idLower = agent.agentId.toLowerCase();
      router.push(`/agents/detectors/${idLower}`);
    } else {
      alert(
        `Agent ${agent.agentId} (${agent.name}): Squad ${agent.squad} detail view is scheduled for downstream authorization.`,
      );
    }
  };

  const filteredAgents = agents
    .filter((ag) => {
      if (
        searchQuery.trim() &&
        !ag.agentId.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ag.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (squadFilter !== "ALL" && ag.squad !== squadFilter) {
        return false;
      }
      if (statusFilter !== "ALL" && ag.status !== statusFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "squad") return a.squad.localeCompare(b.squad);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "uptime") return b.uptime - a.uptime;
      return a.agentId.localeCompare(b.agentId); // default id
    });

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
          <h2 className="text-lg font-bold text-[#FAFAFA]">Agent Fleet Overview</h2>
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
            Agent Fleet Telemetry Retrieval Failed
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
            Retry Fleet Retrieval
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (
    simulateMode === "empty" ||
    (!isLoading && filteredAgents.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              32-Agent Workforce Fleet Overview
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              Authoritative status across Monitors, Detectors, Verification, and Pipeline squads
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter bar visible */}
        <AgentOverviewFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          squadFilter={squadFilter}
          onSquadChange={setSquadFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onReset={() => {
            setSearchQuery("");
            setSquadFilter("ALL");
            setStatusFilter("ALL");
            setSortBy("id");
          }}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No agents match your filter criteria
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {searchQuery || squadFilter !== "ALL" || statusFilter !== "ALL"
              ? "Zero autonomous agents match your search query, squad selection, or health status filter."
              : "Zero agents are currently active in the telemetry ledger."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setSearchQuery("");
                setSquadFilter("ALL");
                setStatusFilter("ALL");
                setAgents(INITIAL_FLEET);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Reset Filters &amp; Load Fleet
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Agent Fleet ({filteredAgents.length} / 32 agents shown)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            32 AI agents powering the Agbofa Nexus AI platform across 4 specialized squads
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setAgents(build32FleetOverview())}
            className="rounded-md border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC]"
          >
            ↻ Refresh Fleet
          </button>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* SQUAD SUMMARY CARDS (grid-cols-1 md:grid-cols-2 lg:grid-cols-4) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => router.push("/agents/monitors")}
          className="group cursor-pointer rounded-lg border border-[#0066CC]/30 bg-[#0066CC]/10 p-4 transition-all hover:border-[#0066CC] hover:shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3399FF]">
              Monitors (8 Agents)
            </span>
            <span className="text-xs text-[#A0A4A8]">→</span>
          </div>
          <p className="mt-1 text-xs text-[#FAFAFA]">
            AGT-001–008: Social media &amp; wire feed signal monitors
          </p>
          <div className="mt-3 flex items-baseline justify-between text-xs">
            <span className="font-bold text-[#0D9040]">8 / 8 Healthy</span>
            <span className="text-[11px] font-semibold text-[#3399FF]">
              Inspect Squad →
            </span>
          </div>
        </div>

        <div
          onClick={() => router.push("/agents/detectors")}
          className="group cursor-pointer rounded-lg border border-[#6C5CE7]/30 bg-[#6C5CE7]/10 p-4 transition-all hover:border-[#6C5CE7] hover:shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6C5CE7]">
              Detectors (8 Agents)
            </span>
            <span className="text-xs text-[#A0A4A8]">→</span>
          </div>
          <p className="mt-1 text-xs text-[#FAFAFA]">
            AGT-009–016: Factual claim, sentiment, &amp; virality MAPE detectors
          </p>
          <div className="mt-3 flex items-baseline justify-between text-xs">
            <span className="font-bold text-[#0D9040]">8 / 8 Healthy</span>
            <span className="text-[11px] font-semibold text-[#6C5CE7]">
              Inspect Squad →
            </span>
          </div>
        </div>

        <div
          onClick={() => alert("Verification squad detail view scheduled for downstream authorization.")}
          className="group cursor-pointer rounded-lg border border-[#0D9040]/30 bg-[#0D9040]/10 p-4 transition-all hover:border-[#0D9040] hover:shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9040]">
              Verification (8 Agents)
            </span>
            <span className="text-xs text-[#A0A4A8]">→</span>
          </div>
          <p className="mt-1 text-xs text-[#FAFAFA]">
            AGT-017–024: Authoritative truth, cross-ref, &amp; bias verifiers
          </p>
          <div className="mt-3 flex items-baseline justify-between text-xs">
            <span className="font-bold text-[#0D9040]">8 / 8 Healthy</span>
            <span className="text-[11px] font-semibold text-[#0D9040]">
              Downstream
            </span>
          </div>
        </div>

        <div
          onClick={() => alert("Pipeline squad detail view scheduled for downstream authorization.")}
          className="group cursor-pointer rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 transition-all hover:border-amber-400 hover:shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Pipeline (8 Agents)
            </span>
            <span className="text-xs text-[#A0A4A8]">→</span>
          </div>
          <p className="mt-1 text-xs text-[#FAFAFA]">
            AGT-025–032: Content packaging, AGT-028 compliance, &amp; distribution
          </p>
          <div className="mt-3 flex items-baseline justify-between text-xs">
            <span className="font-bold text-[#0D9040]">8 / 8 Healthy</span>
            <span className="text-[11px] font-semibold text-amber-400">
              Downstream
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <AgentOverviewFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        squadFilter={squadFilter}
        onSquadChange={setSquadFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={() => {
          setSearchQuery("");
          setSquadFilter("ALL");
          setStatusFilter("ALL");
          setSortBy("id");
        }}
      />

      {/* FULL FLEET GRID (32 cards) */}
      <AgentGrid
        agents={filteredAgents}
        renderAgent={(ag) => (
          <AgentCard
            key={ag.agentId}
            agent={ag}
            onClick={() => handleAgentClick(ag)}
          />
        )}
      />
    </div>
  );
}

interface AgentOverviewFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  squadFilter: string;
  onSquadChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  onReset: () => void;
}

function AgentOverviewFilterBar({
  searchQuery,
  onSearchChange,
  squadFilter,
  onSquadChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  onReset,
}: AgentOverviewFilterBarProps): React.JSX.Element {
  const isFiltered =
    searchQuery.trim() !== "" ||
    squadFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    sortBy !== "id";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by agent ID or name..."
          className="w-56 rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1.5 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
        />

        {/* Squad Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Squad:</label>
          <select
            value={squadFilter}
            onChange={(e) => onSquadChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Squads (32)</option>
            <option value="MONITORS">Monitors (8)</option>
            <option value="DETECTORS">Detectors (8)</option>
            <option value="VERIFICATION">Verification (8)</option>
            <option value="PIPELINE">Pipeline (8)</option>
          </select>
        </div>

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
            <option value="id">Agent ID (Asc)</option>
            <option value="name">Name</option>
            <option value="squad">Squad</option>
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
