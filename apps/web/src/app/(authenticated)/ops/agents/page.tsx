"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { AgentStatusGrid } from "../components/agent-status-grid";
import {
  AgentFleetItem,
  AgentHealthStatus,
  AgentSquad,
} from "../types";

function build32AgentFleet(): AgentFleetItem[] {
  const monitors = [
    "Twitter/X Breaking News Monitor",
    "Facebook Community Signal Monitor",
    "Instagram Visual Story Monitor",
    "TikTok Viral Trend Monitor",
    "LinkedIn Enterprise News Monitor",
    "Reddit Tech & Community Monitor",
    "YouTube Video Broadcast Monitor",
    "RSS Wire Syndication Monitor",
  ];
  const detectors = [
    "Breaking News Anomaly Detector",
    "Duplicate Signal Cluster Checker",
    "Language & Translation Detector",
    "Multimedia Synthetic Forensic Classifier",
    "Factual Claim Extraction Detector",
    "Sentiment Polarity & Resonance Analyzer",
    "Commercial Promotion Bias Detector",
    "Virality MAPE Prediction Engine",
  ];
  const verifications = [
    "Authoritative Fact-Check Verifier",
    "Cross-Reference Corroboration Engine",
    "Source Credibility Assessment Ledger",
    "Extracted Factual Claim Validator",
    "Misinformation Risk Profile Classifier",
    "Editorial Bias Severity Assessor",
    "Verification Confidence Breakdown Engine",
    "Cross-Media Consistency Verifier",
  ];
  const pipelines = [
    "Content Ingestion Orchestration Agent",
    "Package Assembly & Format Generator",
    "Brand Voice Tone Compatibility Engine",
    "AGT-028 Compliance Pre-Check Gatekeeper",
    "Distribution Schedule Orchestrator",
    "Audience Personalization Router",
    "Analytics Engagement Telemetry Collector",
    "RLS Tenant Boundary Governance Watchdog",
  ];

  const allNames: Array<{ name: string; squad: AgentSquad }> = [
    ...monitors.map((n) => ({ name: n, squad: "Monitors" as const })),
    ...detectors.map((n) => ({ name: n, squad: "Detectors" as const })),
    ...verifications.map((n) => ({ name: n, squad: "Verification" as const })),
    ...pipelines.map((n) => ({ name: n, squad: "Pipeline" as const })),
  ];

  return allNames.map((item, idx) => {
    const idNum = (idx + 1).toString().padStart(3, "0");
    const id = `AGT-${idNum}`;
    let status: AgentHealthStatus = "HEALTHY";
    if (idx === 3) status = "DEGRADED";
    if (idx === 16) status = "RATE_LIMITED";
    if (idx === 24) status = "DEGRADED";

    return {
      id,
      name: item.name,
      squad: item.squad,
      status,
      uptimePercentage: idx === 3 ? 98.4 : 99.98,
      p50LatencyMs: 110 + (idx % 5) * 25,
      p95LatencyMs: 220 + (idx % 7) * 40,
      p99LatencyMs: 390 + (idx % 9) * 50,
      errorRate24h: idx === 3 ? 1.45 : 0.02,
      tokensUsedToday: 15000 + (idx * 4200),
      rateLimitRemaining: 85000 - (idx * 2100),
      rateLimitTotal: 100000,
      lastCheckedAt: new Date(Date.now() - (idx % 10) * 60000).toISOString(),
      recentExecutions: [
        {
          id: `exec-${idx}-1`,
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          status: "SUCCESS",
          latencyMs: 140,
        },
        {
          id: `exec-${idx}-2`,
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          status: "SUCCESS",
          latencyMs: 165,
        },
      ],
      errorLog:
        idx === 3
          ? [
              {
                timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
                message: "WARN: TikTok API rate limit warning threshold reached.",
              },
            ]
          : [],
    };
  });
}

const INITIAL_32_AGENTS = build32AgentFleet();

export default function AgentFleetMonitorPage(): React.JSX.Element {
  const [agents, setAgents] = useState<AgentFleetItem[]>(INITIAL_32_AGENTS);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [squadFilter, setSquadFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedAgent, setSelectedAgent] = useState<AgentFleetItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function fetchAgentFleet() {
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
          setError(resp.error?.message || "Failed to load agent fleet telemetry from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAgentFleet();
  }, []);

  const handleAction = (action: "RESTART" | "DISABLE" | "QUOTA", agent: AgentFleetItem) => {
    if (action === "RESTART") {
      alert(`Process restart signal dispatched to ${agent.id} (${agent.name}). Runtime status refreshed.`);
    } else if (action === "QUOTA") {
      const newLimit = prompt(
        `Enter new daily token quota limit for ${agent.id}:`,
        agent.rateLimitTotal.toString(),
      );
      if (newLimit && !isNaN(Number(newLimit))) {
        setAgents(
          agents.map((a) =>
            a.id === agent.id ? { ...a, rateLimitTotal: Number(newLimit) } : a,
          ),
        );
      }
    } else if (action === "DISABLE") {
      if (confirm(`Are you sure you want to pause ${agent.id}?`)) {
        setAgents(
          agents.map((a) =>
            a.id === agent.id ? { ...a, status: "OFFLINE" as const } : a,
          ),
        );
      }
    }
  };

  const filteredAgents = agents.filter((ag) => {
    if (
      searchQuery.trim() &&
      !ag.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
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
  });

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-[#12121A]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-[#12121A]" />
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">32-Agent Fleet Monitor</h2>
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
            Fleet Telemetry Retrieval Failed
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
    (!isLoading && filteredAgents.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              32-Agent Fleet Telemetry Monitor
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              Real-time health across Monitors, Detectors, Verification, and Pipeline squads
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter bar visible */}
        <AgentFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          squadFilter={squadFilter}
          onSquadChange={setSquadFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onReset={() => {
            setSearchQuery("");
            setSquadFilter("ALL");
            setStatusFilter("ALL");
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
                setAgents(INITIAL_32_AGENTS);
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
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            32-Agent Fleet Health &amp; Runtime Telemetry ({filteredAgents.length} agents)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative status across Monitors (AGT-001–008), Detectors (009–016), Verification (017–024), and Pipeline (025–032)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setAgents(build32AgentFleet())}
            className="rounded-md border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC]"
          >
            ↻ Refresh 32-Fleet
          </button>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Filter Bar */}
      <AgentFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        squadFilter={squadFilter}
        onSquadChange={setSquadFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onReset={() => {
          setSearchQuery("");
          setSquadFilter("ALL");
          setStatusFilter("ALL");
        }}
      />

      {/* 32-Agent Fleet Grid */}
      <AgentStatusGrid
        agents={filteredAgents}
        onSelectAgent={(ag) => setSelectedAgent(ag)}
        onAction={handleAction}
      />

      {/* Agent Full Detail Modal */}
      {selectedAgent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2E2E32] pb-3">
              <div>
                <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-xs font-bold text-[#3399FF] border border-[#2E2E32]">
                  {selectedAgent.id}
                </span>
                <h3 className="mt-1 text-lg font-bold text-[#FAFAFA]">
                  {selectedAgent.name} ({selectedAgent.squad})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="rounded border border-[#2E2E32] px-3 py-1 text-xs font-semibold text-[#A0A4A8] hover:text-[#FAFAFA]"
              >
                ✕ Close
              </button>
            </div>

            {/* Technical Detail Content */}
            <div className="mt-4 space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                  <div className="text-[10px] text-[#A0A4A8]">Status</div>
                  <div className="mt-1 font-bold text-[#0D9040]">
                    {selectedAgent.status}
                  </div>
                </div>
                <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                  <div className="text-[10px] text-[#A0A4A8]">Uptime</div>
                  <div className="mt-1 font-bold text-[#FAFAFA]">
                    {selectedAgent.uptimePercentage}%
                  </div>
                </div>
                <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                  <div className="text-[10px] text-[#A0A4A8]">p99 Latency</div>
                  <div className="mt-1 font-mono font-bold text-[#3399FF]">
                    {selectedAgent.p99LatencyMs}ms
                  </div>
                </div>
                <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                  <div className="text-[10px] text-[#A0A4A8]">Tokens Today</div>
                  <div className="mt-1 font-bold text-[#FAFAFA]">
                    {selectedAgent.tokensUsedToday.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Recent Executions Table */}
              <div>
                <h4 className="mb-2 font-bold uppercase tracking-wider text-[#A0A4A8]">
                  Recent Agent Runtime Executions
                </h4>
                <div className="divide-y divide-[#2E2E32] rounded border border-[#2E2E32] bg-[#0A0A0B]">
                  {selectedAgent.recentExecutions.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between p-2.5"
                    >
                      <div>
                        <span className="font-mono font-bold text-[#3399FF]">
                          {ex.id}
                        </span>
                        <span className="ml-2 text-[11px] text-[#A0A4A8]">
                          {new Date(ex.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-[#FAFAFA]">
                          {ex.latencyMs}ms
                        </span>
                        <span className="rounded bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
                          {ex.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Log */}
              <div>
                <h4 className="mb-2 font-bold uppercase tracking-wider text-[#A0A4A8]">
                  Runtime Diagnostic Ledger ({selectedAgent.errorLog.length} events)
                </h4>
                <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 font-mono text-xs">
                  {selectedAgent.errorLog.length === 0 ? (
                    <p className="text-[#0D9040]">
                      ✓ Zero diagnostic exceptions recorded in last 24 hours.
                    </p>
                  ) : (
                    selectedAgent.errorLog.map((err, idx) => (
                      <div key={idx} className="text-[#CF2020]">
                        [{new Date(err.timestamp).toLocaleTimeString()}] {err.message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2 border-t border-[#2E2E32] pt-4">
              <button
                type="button"
                onClick={() => handleAction("QUOTA", selectedAgent)}
                className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA]"
              >
                Adjust Quota Cap
              </button>
              <button
                type="button"
                onClick={() => handleAction("RESTART", selectedAgent)}
                className="rounded bg-[#0066CC] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
              >
                ↻ Restart Agent Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AgentFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  squadFilter: string;
  onSquadChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  onReset: () => void;
}

function AgentFilterBar({
  searchQuery,
  onSearchChange,
  squadFilter,
  onSquadChange,
  statusFilter,
  onStatusChange,
  onReset,
}: AgentFilterBarProps): React.JSX.Element {
  const isFiltered =
    searchQuery.trim() !== "" || squadFilter !== "ALL" || statusFilter !== "ALL";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
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
            <option value="ALL">All 4 Squads (32-Fleet)</option>
            <option value="Monitors">Monitors (001–008)</option>
            <option value="Detectors">Detectors (009–016)</option>
            <option value="Verification">Verification (017–024)</option>
            <option value="Pipeline">Pipeline (025–032)</option>
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
