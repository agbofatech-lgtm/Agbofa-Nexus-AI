"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../lib/bff/client";
import { AIControlDashboardStats, AIRoutingActivityEvent } from "./types";

const INITIAL_AI_STATS: AIControlDashboardStats = {
  activeModelsCount: 5,
  totalPromptsCount: 12,
  tokensUsedToday: 485200,
  dailyTokenLimit: 1000000,
  tokenUsagePercentage: 48.5,
  fleetHealthStatus: "HEALTHY",
  healthyAgentsCount: 32,
  totalAgentsCount: 32,
  estimatedDailyCostUsd: 14.85,
};

const SAMPLE_ROUTING_ACTIVITIES: AIRoutingActivityEvent[] = [
  {
    id: "rte-1",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    agentId: "AGT-017 Fact-Check Agent",
    modelUsed: "gpt-4o-2024-08",
    provider: "OpenAI",
    taskType: "fact-check",
    latencyMs: 420,
    tokensConsumed: 1850,
    fallbackTriggered: false,
  },
  {
    id: "rte-2",
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    agentId: "AGT-026 Package Assembly Agent",
    modelUsed: "claude-3-5-sonnet",
    provider: "Anthropic",
    taskType: "summarization",
    latencyMs: 380,
    tokensConsumed: 2400,
    fallbackTriggered: false,
  },
  {
    id: "rte-3",
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    agentId: "AGT-013 Multimedia Classifier",
    modelUsed: "gemini-1.5-pro-vision",
    provider: "Google",
    taskType: "vision",
    latencyMs: 610,
    tokensConsumed: 3100,
    fallbackTriggered: false,
  },
  {
    id: "rte-4",
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    agentId: "AGT-024 Personalization Engine",
    modelUsed: "gpt-4o-mini",
    provider: "OpenAI",
    taskType: "summarization",
    latencyMs: 190,
    tokensConsumed: 620,
    fallbackTriggered: true,
  },
];

function getProviderStyle(provider: string): string {
  switch (provider) {
    case "OpenAI":
      return "bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/40";
    case "Anthropic":
      return "bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/40";
    case "Google":
      return "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40";
    default:
      return "bg-[#2E2E32]/50 text-[#FAFAFA] border border-[#2E2E32]";
  }
}

export default function AIControlDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const [stats, setStats] = useState<AIControlDashboardStats>(INITIAL_AI_STATS);
  const [activities, setActivities] = useState<AIRoutingActivityEvent[]>(
    SAMPLE_ROUTING_ACTIVITIES,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchDashboard() {
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
          setError(resp.error?.message || "Failed to load AI Control dashboard from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

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
          <h2 className="text-lg font-bold text-[#FAFAFA]">AI Control Overview</h2>
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
            AI Control Dashboard Retrieval Failed
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
  if (simulateMode === "empty" || (!isLoading && activities.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">AI Control Overview</h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No AI routing activity logged
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            Zero model invocations or token usage events have been recorded across the 32-agent fleet today.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setActivities(SAMPLE_ROUTING_ACTIVITIES);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample AI Routing Ledger
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            AI Gateway Model Routing &amp; Token Quota Telemetry
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Real-time monitoring across OpenAI, Anthropic, Google Gemini, and custom AI providers
          </p>
        </div>
        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* STAT CARDS Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => router.push("/ai-control/models")}
          className="group flex cursor-pointer flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-all hover:border-[#0066CC] hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Active Models
            </span>
            <span className="rounded-full bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF] border border-[#0066CC]/40">
              {stats.activeModelsCount} ACTIVE
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#FAFAFA]">
              {stats.activeModelsCount} / 6
            </span>
            <span className="text-xs font-medium text-[#3399FF]">Manage →</span>
          </div>
        </div>

        <div
          onClick={() => router.push("/ai-control/prompts")}
          className="group flex cursor-pointer flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-all hover:border-[#6C5CE7] hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Total Prompts
            </span>
            <span className="rounded-full bg-[#6C5CE7]/20 px-2 py-0.5 text-[10px] font-bold text-[#6C5CE7] border border-[#6C5CE7]/40">
              Authoritative
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#FAFAFA]">
              {stats.totalPromptsCount}
            </span>
            <span className="text-xs font-medium text-[#6C5CE7]">Registry →</span>
          </div>
        </div>

        <div
          onClick={() => router.push("/ai-control/quotas")}
          className="group flex cursor-pointer flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-all hover:border-[#3399FF] hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Today&apos;s Token Usage
            </span>
            <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              {stats.tokenUsagePercentage}% used
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#FAFAFA]">
              {(stats.tokensUsedToday / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-mono text-[#A0A4A8]">
              / {(stats.dailyTokenLimit / 1000).toFixed(0)}k limit
            </span>
          </div>
        </div>

        <div
          onClick={() => router.push("/ai-control/quotas")}
          className="group flex cursor-pointer flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-all hover:border-[#0D9040] hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Agent Fleet Health
            </span>
            <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              {stats.fleetHealthStatus}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#0D9040]">
              {stats.healthyAgentsCount} / {stats.totalAgentsCount}
            </span>
            <span className="text-xs font-medium text-[#0D9040]">
              All Squads OK
            </span>
          </div>
        </div>
      </div>

      {/* QUICK LINKS Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
          AI Gateway Quick Navigation
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            onClick={() => router.push("/ai-control/models")}
            className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 transition-all hover:border-[#0066CC] hover:shadow"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-[#3399FF]">
                🤖 Manage Models &amp; Providers
              </span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <p className="text-[11px] text-[#A0A4A8]">
              Configure fallback order, default task routing, and inspect provider health.
            </p>
          </div>

          <div
            onClick={() => router.push("/ai-control/prompts")}
            className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 transition-all hover:border-[#6C5CE7] hover:shadow"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-[#6C5CE7]">
                📜 Prompt Registry &amp; Templates
              </span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <p className="text-[11px] text-[#A0A4A8]">
              Inspect prompt templates, edit variables, test outputs, and promote versions.
            </p>
          </div>

          <div
            onClick={() => router.push("/ai-control/quotas")}
            className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 transition-all hover:border-[#0D9040] hover:shadow"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-[#0D9040]">
                📊 Quota Monitor &amp; Costs
              </span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <p className="text-[11px] text-[#A0A4A8]">
              View per-provider charts, 7-day token trends, and 32-agent rate limit status.
            </p>
          </div>
        </div>
      </div>

      {/* RECENT AI ROUTING ACTIVITY FEED */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <div className="mb-4 flex items-center justify-between border-b border-[#2E2E32] pb-3">
          <h3 className="text-sm font-bold text-[#FAFAFA]">
            Recent AIGatewayService Model Routing Activity
          </h3>
          <span className="text-xs text-[#A0A4A8]">
            Live telemetry from runtime.v1.AIGatewayService
          </span>
        </div>
        <div className="divide-y divide-[#2E2E32]">
          {activities.map((ev) => (
            <div
              key={ev.id}
              className="flex flex-col justify-between gap-2 py-3 text-xs sm:flex-row sm:items-center"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getProviderStyle(
                      ev.provider,
                    )}`}
                  >
                    {ev.provider} · {ev.modelUsed}
                  </span>
                  {ev.fallbackTriggered && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/40">
                      ⚡ FALLBACK TRIGGERED
                    </span>
                  )}
                </div>
                <div className="mt-1 font-bold text-[#FAFAFA]">
                  {ev.agentId} <span className="font-normal text-[#A0A4A8]">→ task: {ev.taskType}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center space-x-3 text-right">
                <div>
                  <div className="font-mono font-bold text-[#FAFAFA]">
                    {ev.tokensConsumed} tokens
                  </div>
                  <div className="text-[11px] text-[#A0A4A8]">
                    {ev.latencyMs}ms latency
                  </div>
                </div>
                <span className="text-[11px] text-[#A0A4A8]">
                  {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
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
