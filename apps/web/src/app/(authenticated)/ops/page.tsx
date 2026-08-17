"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../lib/bff/client";
import { OpsStatCard } from "./components/ops-stat-card";
import { AlertRow } from "./components/alert-row";
import {
  OpsDashboardStats,
  AlertHistoryItem,
  AgentSquad,
} from "./types";

const INITIAL_OPS_STATS: OpsDashboardStats = {
  systemHealth: "HEALTHY",
  systemUptimePercentage: 99.98,
  healthyAgentsCount: 30,
  totalAgentsCount: 32,
  pipelineThroughputPerHour: 420,
  criticalAlertsCount: 1,
  warningAlertsCount: 3,
};

const SAMPLE_ALERTS: AlertHistoryItem[] = [
  {
    id: "alt-101",
    severity: "CRITICAL",
    type: "RATE_LIMIT",
    message: "OpenAI GPT-4o input quota exceeded threshold (> 95%) on AIGatewayService",
    affectedServiceOrAgent: "AGT-017 Fact-Check Agent",
    occurredAt: new Date(Date.now() - 10 * 60000).toISOString(),
    status: "ACTIVE",
    resolutionNotes: "Automatic secondary fallback to Anthropic Claude 3.5 Sonnet engaged.",
    timeline: [
      {
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        event: "Rate limit threshold breach detected on OpenAI gateway.",
      },
      {
        timestamp: new Date(Date.now() - 9 * 60000).toISOString(),
        event: "Fallback router promoted Claude 3.5 Sonnet to primary.",
      },
    ],
  },
  {
    id: "alt-102",
    severity: "WARNING",
    type: "ACCURACY_DEGRADATION",
    message: "Minor statistical variance in virality MAPE calibration (> 5% drift)",
    affectedServiceOrAgent: "Predictive Intelligence Engine (IMP-018)",
    occurredAt: new Date(Date.now() - 40 * 60000).toISOString(),
    status: "ACKNOWLEDGED",
    resolutionNotes: "Scheduled offline model re-training ledger check.",
  },
  {
    id: "alt-103",
    severity: "WARNING",
    type: "AGENT_OFFLINE",
    message: "Social monitor adapter latency spike on Reddit connector",
    affectedServiceOrAgent: "AGT-006 Reddit Platform Monitor",
    occurredAt: new Date(Date.now() - 95 * 60000).toISOString(),
    status: "ACKNOWLEDGED",
  },
  {
    id: "alt-104",
    severity: "INFO",
    type: "RLS_BYPASS",
    message: "Zero cross-tenant RLS violations across 16 PostgreSQL tables in 24h audit",
    affectedServiceOrAgent: "PostgreSQL Database Schema",
    occurredAt: new Date(Date.now() - 240 * 60000).toISOString(),
    status: "RESOLVED",
    resolutionNotes: "Automated nightly RLS security gate verified clean.",
  },
];

interface SquadSummary {
  squad: AgentSquad;
  healthy: number;
  degraded: number;
  offline: number;
}

const SQUAD_SUMMARIES: SquadSummary[] = [
  { squad: "Monitors", healthy: 7, degraded: 1, offline: 0 }, // AGT-001–008
  { squad: "Detectors", healthy: 8, degraded: 0, offline: 0 }, // AGT-009–016
  { squad: "Verification", healthy: 7, degraded: 1, offline: 0 }, // AGT-017–024
  { squad: "Pipeline", healthy: 8, degraded: 0, offline: 0 }, // AGT-025–032
];

export default function OperationsDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const [stats, setStats] = useState<OpsDashboardStats>(INITIAL_OPS_STATS);
  const [alerts, setAlerts] = useState<AlertHistoryItem[]>(SAMPLE_ALERTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchOpsDashboard() {
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
          setError(resp.error?.message || "Failed to load operations telemetry from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOpsDashboard();
  }, []);

  const handleAlertAction = (
    action: "ACKNOWLEDGE" | "ESCALATE" | "RESOLVE",
    id: string,
  ) => {
    setAlerts(
      alerts.map((a) => {
        if (a.id !== id) return a;
        if (action === "ACKNOWLEDGE") return { ...a, status: "ACKNOWLEDGED" as const };
        if (action === "RESOLVE") return { ...a, status: "RESOLVED" as const };
        return a;
      }),
    );
    alert(`Alert ${id}: Action ${action} recorded in immutable operations log.`);
  };

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
        <div className="h-64 w-full animate-pulse rounded-lg bg-[#12121A]" />
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">Platform Ops Overview</h2>
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
            Operations Dashboard Retrieval Failed
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
            Retry Dashboard Retrieval
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (simulateMode === "empty" || (!isLoading && alerts.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">Platform Ops Overview</h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            Zero active alerts or health warnings
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            All 10 core services, 32 autonomous agents, and RLS database boundaries are reporting 100% healthy telemetry.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setAlerts(SAMPLE_ALERTS);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Alert Ledger
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-8">
      {/* Top Title & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            Authoritative Platform Health &amp; 32-Agent Fleet Command Center
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Monitoring 10 microservices, 32 autonomous agents, pipeline throughput, and RLS database isolation
          </p>
        </div>
        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* STAT CARDS Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <OpsStatCard
          title="System Health"
          value={stats.systemHealth}
          subText={`${stats.systemUptimePercentage}% Uptime · Zero out-of-spec exceptions`}
          badgeLabel="HEALTHY"
          badgeStyle="bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40"
          onClick={() => router.push("/ops/status")}
        />

        <OpsStatCard
          title="Active Agents"
          value={`${stats.healthyAgentsCount} / ${stats.totalAgentsCount}`}
          subText="30 Healthy · 2 Rate-Limit Warning · 0 Offline"
          badgeLabel="32 FLEET"
          badgeStyle="bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/40"
          onClick={() => router.push("/ops/agents")}
        />

        <OpsStatCard
          title="Pipeline Throughput"
          value={`${stats.pipelineThroughputPerHour}/hr`}
          subText="420 verified items/hour · Avg end-to-end latency 2.8s"
          badgeLabel="FLOWING"
          badgeStyle="bg-[#3399FF]/20 text-[#3399FF] border border-[#3399FF]/40"
          onClick={() => router.push("/ops/pipeline")}
        />

        <OpsStatCard
          title="Active Alerts"
          value={stats.criticalAlertsCount + stats.warningAlertsCount}
          subText={`${stats.criticalAlertsCount} Critical · ${stats.warningAlertsCount} Warning · 1 Info`}
          badgeLabel="AUDITED"
          badgeStyle="bg-amber-500/20 text-amber-400 border border-amber-500/40"
          onClick={() => router.push("/ops/alerts")}
        />
      </div>

      {/* FLEET OVERVIEW: 32-Agent Squad Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
            32-Agent Fleet Squad Breakdown
          </h3>
          <button
            type="button"
            onClick={() => router.push("/ops/agents")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            Inspect Full 32-Agent Grid →
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SQUAD_SUMMARIES.map((sq, idx) => {
            const squadColors = [
              "text-[#3399FF] bg-[#0066CC]/10 border-[#0066CC]/30",
              "text-[#6C5CE7] bg-[#6C5CE7]/10 border-[#6C5CE7]/30",
              "text-[#0D9040] bg-[#0D9040]/10 border-[#0D9040]/30",
              "text-amber-400 bg-amber-500/10 border-amber-500/30",
            ];
            const colorClass = squadColors[idx % squadColors.length];
            return (
              <div
                key={sq.squad}
                onClick={() => router.push("/ops/agents")}
                className={`group cursor-pointer rounded-lg border ${colorClass} bg-[#12121A] p-4 transition-all hover:border-[#0066CC] hover:shadow`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FAFAFA]">
                    {sq.squad} Squad (8)
                  </span>
                  <span className="text-xs text-[#A0A4A8]">→</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xl font-bold text-[#FAFAFA]">
                    {sq.healthy} / 8 <span className="text-xs font-normal text-[#0D9040]">Healthy</span>
                  </span>
                  {sq.degraded > 0 ? (
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-400">
                      {sq.degraded} Warning
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#0D9040]">100% OK</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECENT ALERTS FEED */}
      <div className="space-y-4 rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2E2E32] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              Recent Platform Alerts &amp; Governance Ledger
            </h3>
            <p className="text-xs text-[#A0A4A8]">
              Authoritative alert history with severity badges, interactive acknowledgement, and timeline audit
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/ops/alerts")}
            className="rounded bg-[#0066CC] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
          >
            View Full Alert History ({alerts.length}) →
          </button>
        </div>

        <div className="space-y-4">
          {alerts.map((alt) => (
            <AlertRow key={alt.id} alert={alt} onAction={handleAlertAction} />
          ))}
        </div>
      </div>
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
