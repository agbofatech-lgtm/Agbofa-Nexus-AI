"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../../lib/bff/client";
import { PlatformHealth } from "../../components/platform-health";
import { SignalStream } from "../../components/signal-stream";
import { SignalSummary } from "../../components/signal-summary";
import {
  MonitorAgent,
  MonitorSignal,
  HourlyDataPoint,
  TopKeyword,
  AgentHealthStatusType,
} from "../../types";

export interface MonitorDetailPageProps {
  params: {
    agentId: string;
  };
}

function getPlatformIcon(platform: string): string {
  const upper = platform.toUpperCase();
  if (upper === "TWITTER" || upper === "X") return "𝕏";
  if (upper === "FACEBOOK") return "f";
  if (upper === "INSTAGRAM") return "IG";
  if (upper === "TIKTOK") return "TT";
  if (upper === "LINKEDIN") return "in";
  if (upper === "YOUTUBE") return "▶";
  if (upper === "REDDIT") return "r/";
  if (upper === "RSS") return "📰";
  return "⚡";
}

function getStatusStyle(status: AgentHealthStatusType): { label: string; style: string } {
  switch (status) {
    case "HEALTHY":
      return {
        label: "HEALTHY",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-bold",
      };
    case "DEGRADED":
      return {
        label: "DEGRADED",
        style: "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold",
      };
    case "RATE_LIMITED":
      return {
        label: "RATE LIMITED",
        style: "bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold",
      };
    case "AUTH_FAILED":
      return {
        label: "AUTH FAILED",
        style: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold",
      };
    case "OFFLINE":
    default:
      return {
        label: "OFFLINE",
        style: "bg-[#2E2E32]/50 text-[#A0A4A8] border border-[#2E2E32]",
      };
  }
}

function resolveMonitorMetadata(idSlug: string): MonitorAgent {
  const upper = idSlug.toUpperCase();
  const idNum = upper.replace("AGT-", "");
  const num = parseInt(idNum, 10);

  const configs = [
    {
      id: "AGT-001",
      name: "X/Twitter Breaking Signal Monitor",
      platform: "TWITTER" as const,
      signals: 1450,
      latency: 142,
      used: 380,
      total: 500,
      reset: "14m 20s",
      status: "HEALTHY" as const,
    },
    {
      id: "AGT-002",
      name: "Facebook Community Signal Monitor",
      platform: "FACEBOOK" as const,
      signals: 820,
      latency: 185,
      used: 120,
      total: 300,
      reset: "25m 10s",
      status: "HEALTHY" as const,
    },
    {
      id: "AGT-003",
      name: "Instagram Visual Story Monitor",
      platform: "INSTAGRAM" as const,
      signals: 640,
      latency: 210,
      used: 180,
      total: 250,
      reset: "40m 00s",
      status: "HEALTHY" as const,
    },
    {
      id: "AGT-004",
      name: "TikTok Viral Trend Monitor",
      platform: "TIKTOK" as const,
      signals: 1240,
      latency: 310,
      used: 480,
      total: 500,
      reset: "08m 45s",
      status: "RATE_LIMITED" as const,
    },
    {
      id: "AGT-005",
      name: "LinkedIn Enterprise News Monitor",
      platform: "LINKEDIN" as const,
      signals: 390,
      latency: 160,
      used: 95,
      total: 200,
      reset: "32m 15s",
      status: "HEALTHY" as const,
    },
    {
      id: "AGT-006",
      name: "YouTube Video Broadcast Monitor",
      platform: "YOUTUBE" as const,
      signals: 510,
      latency: 280,
      used: 210,
      total: 400,
      reset: "50m 30s",
      status: "HEALTHY" as const,
    },
    {
      id: "AGT-007",
      name: "Reddit Tech & Community Monitor",
      platform: "REDDIT" as const,
      signals: 920,
      latency: 130,
      used: 140,
      total: 300,
      reset: "18m 10s",
      status: "HEALTHY" as const,
    },
    {
      id: "AGT-008",
      name: "RSS Wire Syndication & Emerging Monitor",
      platform: "RSS" as const,
      signals: 2180,
      latency: 95,
      used: 420,
      total: 1000,
      reset: "59m 50s",
      status: "HEALTHY" as const,
    },
  ];

  const matched =
    configs.find((c) => c.id === upper || c.id === `AGT-00${num}` || c.id === `AGT-0${num}`) ||
    configs[0];

  return {
    agentId: matched.id,
    name: matched.name,
    squad: "MONITORS",
    status: matched.status,
    version: "1.0.0",
    uptime: matched.status === "RATE_LIMITED" ? 98.4 : 99.98,
    lastHealthCheck: new Date(Date.now() - 3 * 60000).toISOString(),
    platform: matched.platform,
    signalsDetected24h: matched.signals,
    avgFetchLatencyMs: matched.latency,
    rateLimit: {
      used: matched.used,
      total: matched.total,
      resetTime: matched.reset,
    },
    apiStatus: matched.status === "RATE_LIMITED" ? "DEGRADED" : "CONNECTED",
  };
}

function buildSampleSignals(agentId: string, platform: string): MonitorSignal[] {
  return [
    {
      signalId: `${agentId}-sig-01`,
      agentId,
      platform,
      detectedAt: new Date(Date.now() - 2 * 60000).toISOString(),
      contentType: "WIRE_FEED",
      contentPreview:
        "BREAKING: Agbofa Nexus AI deploys 32 specialized autonomous agents across global newsroom operations. ⚡",
      signalType: "BREAKING",
      priority: "C1",
    },
    {
      signalId: `${agentId}-sig-02`,
      agentId,
      platform,
      detectedAt: new Date(Date.now() - 14 * 60000).toISOString(),
      contentType: "SOCIAL_POST",
      contentPreview:
        "Trending discussion: AI compute efficiency metrics and MAPE virality forecasting models in production.",
      signalType: "TREND",
      priority: "C2",
    },
    {
      signalId: `${agentId}-sig-03`,
      agentId,
      platform,
      detectedAt: new Date(Date.now() - 35 * 60000).toISOString(),
      contentType: "THREAD_COMMENT",
      contentPreview:
        "Community sentiment overwhelmingly positive regarding RLS multi-tenant PostgreSQL isolation guarantees.",
      signalType: "SENTIMENT",
      priority: "C3",
    },
    {
      signalId: `${agentId}-sig-04`,
      agentId,
      platform,
      detectedAt: new Date(Date.now() - 60 * 60000).toISOString(),
      contentType: "VIDEO_CAPTION",
      contentPreview:
        "Engagement spike detected on multi-channel newsroom overview video release (+185% views).",
      signalType: "ENGAGEMENT",
      priority: "C2",
    },
  ];
}

const SAMPLE_HOURLY_DATA: HourlyDataPoint[] = [
  { hour: "00:00", signals: 45 },
  { hour: "04:00", signals: 82 },
  { hour: "08:00", signals: 145 },
  { hour: "12:00", signals: 210 },
  { hour: "16:00", signals: 185 },
  { hour: "20:00", signals: 110 },
];

const SAMPLE_KEYWORDS: TopKeyword[] = [
  { keyword: "#AgbofaNexus", count: 142, category: "TOPIC" },
  { keyword: "32-Agent Workforce", count: 98, category: "ENTITY" },
  { keyword: "Row-Level Security", count: 53, category: "TOPIC" },
  { keyword: "Content Factory", count: 48, category: "ENTITY" },
];

export default function MonitorAgentDetailPage({
  params,
}: MonitorDetailPageProps): React.JSX.Element {
  const router = useRouter();
  const { agentId } = params;

  const [agent, setAgent] = useState<MonitorAgent>(() =>
    resolveMonitorMetadata(agentId),
  );
  const [signals, setSignals] = useState<MonitorSignal[]>(() =>
    buildSampleSignals(agent.agentId, agent.platform),
  );
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedSignalModal, setSelectedSignalModal] = useState<MonitorSignal | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  const loadAgentTelemetry = useCallback(async () => {
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
        setError(resp.error?.message || "Failed to load agent detail from BFF.");
      } else {
        const ag = resolveMonitorMetadata(agentId);
        setAgent(ag);
        setSignals(buildSampleSignals(ag.agentId, ag.platform));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (simulateMode === "normal") {
      loadAgentTelemetry();
    }
  }, [loadAgentTelemetry, simulateMode]);

  const handlePauseMonitoring = () => {
    setIsPaused(true);
    alert(`Monitoring stream for ${agent.agentId} PAUSED.`);
  };

  const handleResumeMonitoring = () => {
    setIsPaused(false);
    alert(`Monitoring stream for ${agent.agentId} RESUMED.`);
  };

  const handleAdjustRateLimit = () => {
    const newTotal = prompt(
      `Enter new daily API request limit for ${agent.agentId}:`,
      agent.rateLimit.total.toString(),
    );
    if (newTotal && !isNaN(Number(newTotal))) {
      setAgent({
        ...agent,
        rateLimit: { ...agent.rateLimit, total: Number(newTotal) },
      });
    }
  };

  const handleReinitializeAgent = () => {
    alert(`Process reinitialize signal dispatched to ${agent.agentId} (${agent.name}). OAuth connector refreshed.`);
    setAgent({
      ...agent,
      status: "HEALTHY",
      apiStatus: "CONNECTED",
      rateLimit: { ...agent.rateLimit, used: 0 },
    });
  };

  const icon = getPlatformIcon(agent.platform);
  const statusBadge = getStatusStyle(agent.status);
  const ratePct = Math.round((agent.rateLimit.used / agent.rateLimit.total) * 100);

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
          <button
            type="button"
            onClick={() => router.push("/agents/monitors")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Monitors
          </button>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-36 animate-pulse rounded-lg bg-[#12121A]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-[#12121A]" />
          ))}
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
          <button
            type="button"
            onClick={() => router.push("/agents/monitors")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Monitors
          </button>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
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
            {error || "Agent Detail Telemetry Failed"}
          </h3>
          <p className="mb-6 text-xs text-[#A0A4A8]">
            We could not retrieve the requested agent telemetry from ContentOriginationService.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              onClick={() => {
                if (simulateMode === "error") setSimulateMode("normal");
                else loadAgentTelemetry();
              }}
              className="rounded-md bg-[#0066CC] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/agents/monitors")}
              className="rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-4 py-2 text-xs font-semibold text-[#FAFAFA]"
            >
              Return to Squad
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (simulateMode === "empty" || (!isLoading && signals.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
          <button
            type="button"
            onClick={() => router.push("/agents/monitors")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Monitors
          </button>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            Zero detected signals for {agent.agentId} ({agent.name})
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            The monitor adapter has zero signal events queued in the selected window. The stream is connected and awaiting incoming items.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setSignals(buildSampleSignals(agent.agentId, agent.platform));
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Signal Ledger
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-8">
      {/* Top Back Nav & Testing Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <button
          type="button"
          onClick={() => router.push("/agents/monitors")}
          className="text-xs font-semibold text-[#3399FF] hover:underline"
        >
          ← Back to Platform Monitors Squad
        </button>
        <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* AGENT HEADER CARD */}
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow md:flex-row md:items-center">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#2E2E32] bg-[#0A0A0B] text-2xl font-bold text-[#3399FF]">
            {icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#0A0A0B] px-2.5 py-0.5 font-mono text-xs font-bold text-[#FAFAFA] border border-[#2E2E32]">
                {agent.agentId}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${statusBadge.style}`}
              >
                ● {statusBadge.label}
              </span>
              <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-[11px] text-[#A0A4A8] border border-[#2E2E32]">
                v:{agent.version}
              </span>
              <span className="rounded bg-[#0066CC]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#3399FF] border border-[#0066CC]/30">
                {agent.squad} SQUAD
              </span>
            </div>
            <h1 className="mt-2 text-xl font-bold text-[#FAFAFA] md:text-2xl">
              {agent.name}
            </h1>
          </div>
        </div>

        {/* AGENT ACTIONS TOOLBAR */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={isPaused ? handleResumeMonitoring : handlePauseMonitoring}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              isPaused
                ? "bg-[#0D9040] text-white hover:bg-[#0D9040]/80"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30"
            }`}
          >
            {isPaused ? "▶ Resume Monitoring" : "⏸ Pause Monitoring"}
          </button>
          <button
            type="button"
            onClick={handleAdjustRateLimit}
            className="rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC]"
          >
            Adjust Rate Limit
          </button>
          <button
            type="button"
            onClick={handleReinitializeAgent}
            className="rounded-md bg-[#0066CC] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
          >
            ↻ Reinitialize Agent
          </button>
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC]"
          >
            ⚙ View Config
          </button>
        </div>
      </div>

      {/* METRICS ROW (grid-cols-2 lg:grid-cols-4) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Uptime &amp; SLA
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9040]">
            {agent.uptime}% <span className="text-xs font-normal text-[#0D9040]">▲ +0.02%</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Continuous 24h reliability
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Signals Detected (24h)
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {agent.signalsDetected24h.toLocaleString()}{" "}
            <span className="text-xs font-normal text-[#3399FF]">▲ +18%</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Real-time wire &amp; social ingestion
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Avg Fetch Latency (p95)
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-[#3399FF]">
            {agent.avgFetchLatencyMs}ms
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            API polling turnaround
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Rate Limit Quota
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {agent.rateLimit.used} / {agent.rateLimit.total}{" "}
            <span className="text-xs font-normal text-[#A0A4A8]">({ratePct}%)</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
            <div
              className={`h-full transition-all ${
                ratePct >= 80
                  ? "bg-[#CF2020]"
                  : ratePct >= 50
                  ? "bg-amber-500"
                  : "bg-[#0D9040]"
              }`}
              style={{ width: `${Math.min(100, ratePct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* RATE LIMIT & PLATFORM HEALTH */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
          Platform Rate Limits &amp; Connector Health
        </h3>
        <PlatformHealth
          rateLimit={agent.rateLimit}
          apiStatus={agent.apiStatus}
        />
      </div>

      {/* SIGNAL STREAM */}
      <SignalStream
        signals={signals}
        isLoading={isLoading}
        isPaused={isPaused}
        onPause={handlePauseMonitoring}
        onResume={handleResumeMonitoring}
        onSignalClick={(sig) => setSelectedSignalModal(sig)}
        selectedType={selectedType}
        onSelectType={setSelectedType}
      />

      {/* SIGNAL SUMMARY STATS & CHARTS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
          Signal Ingestion Statistics &amp; Entity Distribution
        </h3>
        <SignalSummary
          totalSignals={agent.signalsDetected24h}
          byType={[
            { type: "BREAKING", count: Math.round(agent.signalsDetected24h * 0.15) },
            { type: "TREND", count: Math.round(agent.signalsDetected24h * 0.45) },
            { type: "SENTIMENT", count: Math.round(agent.signalsDetected24h * 0.25) },
            { type: "ENGAGEMENT", count: Math.round(agent.signalsDetected24h * 0.15) },
          ]}
          byPriority={[
            { priority: "C1", count: Math.round(agent.signalsDetected24h * 0.15) },
            { priority: "C2", count: Math.round(agent.signalsDetected24h * 0.5) },
            { priority: "C3", count: Math.round(agent.signalsDetected24h * 0.35) },
          ]}
          hourlyData={SAMPLE_HOURLY_DATA}
          topKeywords={SAMPLE_KEYWORDS}
        />
      </div>

      {/* Signal Detail Modal */}
      {selectedSignalModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-lg rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2E2E32] pb-3">
              <div>
                <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-xs font-bold text-[#3399FF] border border-[#2E2E32]">
                  {selectedSignalModal.signalId}
                </span>
                <span className="ml-2 rounded bg-[#CF2020]/20 px-2 py-0.5 text-[10px] font-bold text-[#CF2020]">
                  {selectedSignalModal.priority} · {selectedSignalModal.signalType}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSignalModal(null)}
                className="text-xs text-[#A0A4A8] hover:text-[#FAFAFA]"
              >
                ✕ Close
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div className="text-base font-bold text-[#FAFAFA]">
                &ldquo;{selectedSignalModal.contentPreview}&rdquo;
              </div>
              <div className="grid grid-cols-2 gap-2 text-[#A0A4A8]">
                <div>Platform: <strong className="text-[#FAFAFA]">{selectedSignalModal.platform}</strong></div>
                <div>Format: <strong className="text-[#FAFAFA]">{selectedSignalModal.contentType}</strong></div>
                <div>Detected At: <strong className="text-[#FAFAFA]">{new Date(selectedSignalModal.detectedAt).toLocaleString()}</strong></div>
                <div>Agent ID: <strong className="text-[#3399FF]">{selectedSignalModal.agentId}</strong></div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2 border-t border-[#2E2E32] pt-4">
              <button
                type="button"
                onClick={() => setSelectedSignalModal(null)}
                className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-4 py-1.5 text-xs font-medium text-[#FAFAFA]"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Configuration Modal */}
      {showConfigModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-lg rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-bold text-[#FAFAFA]">
              Agent Runtime Configuration: {agent.agentId} ({agent.name})
            </h3>
            <div className="mt-3 space-y-2 rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 font-mono text-xs text-[#FAFAFA]">
              <div>agent_id: &quot;{agent.agentId}&quot;</div>
              <div>squad: &quot;{agent.squad}&quot;</div>
              <div>platform_adapter: &quot;{agent.platform}&quot;</div>
              <div>polling_interval_sec: 15</div>
              <div>batch_ingest_max: 100</div>
              <div>oauth_token_status: &quot;AUTHENTICATED_SECURE&quot;</div>
              <div>rls_tenant_boundary: &quot;tenant-default&quot;</div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="rounded bg-[#0066CC] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
              >
                Close Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SimulationDetailToolbarProps {
  currentMode: "normal" | "loading" | "empty" | "error";
  onSelectMode: (mode: "normal" | "loading" | "empty" | "error") => void;
}

function SimulationDetailToolbar({
  currentMode,
  onSelectMode,
}: SimulationDetailToolbarProps): React.JSX.Element {
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
