"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { QuotaChart } from "../components/quota-chart";
import { AgentQuotaRow } from "../components/agent-quota-row";
import {
  AgentQuotaItem,
  ProviderUsageItem,
  DailyUsageTrendItem,
  SquadUsageItem,
  AgentSquad,
} from "../types";

const INITIAL_AGENT_QUOTAS: AgentQuotaItem[] = [
  {
    agentId: "AGT-001",
    agentName: "Twitter/X Breaking News Monitor",
    squad: "Monitors",
    tokensUsedToday: 42000,
    dailyTokenLimit: 50000,
    rateLimitStatus: "WARNING",
    estimatedCostUsd: 1.25,
  },
  {
    id_alias: "AGT-002",
    agentId: "AGT-002",
    agentName: "Facebook Community Signal Monitor",
    squad: "Monitors",
    tokensUsedToday: 18000,
    dailyTokenLimit: 50000,
    rateLimitStatus: "OK",
    estimatedCostUsd: 0.54,
  },
  {
    agentId: "AGT-013",
    agentName: "Multimedia Forensic Classifier",
    squad: "Detectors",
    tokensUsedToday: 89000,
    dailyTokenLimit: 100000,
    rateLimitStatus: "WARNING",
    estimatedCostUsd: 3.12,
  },
  {
    agentId: "AGT-017",
    agentName: "Factual Claim Fact-Check Engine",
    squad: "Verification",
    tokensUsedToday: 125000,
    dailyTokenLimit: 120000,
    rateLimitStatus: "EXCEEDED",
    estimatedCostUsd: 4.85,
  },
  {
    agentId: "AGT-018",
    agentName: "Cross-Reference Consistency Verifier",
    squad: "Verification",
    tokensUsedToday: 65000,
    dailyTokenLimit: 100000,
    rateLimitStatus: "OK",
    estimatedCostUsd: 2.15,
  },
  {
    agentId: "AGT-024",
    agentName: "Advanced Personalization Engine",
    squad: "Pipeline",
    tokensUsedToday: 54000,
    dailyTokenLimit: 100000,
    rateLimitStatus: "OK",
    estimatedCostUsd: 1.62,
  },
  {
    agentId: "AGT-026",
    agentName: "Multi-Channel Package Assembler",
    squad: "Pipeline",
    tokensUsedToday: 92200,
    dailyTokenLimit: 100000,
    rateLimitStatus: "WARNING",
    estimatedCostUsd: 3.45,
  },
];

const INITIAL_PROVIDER_USAGE: ProviderUsageItem[] = [
  { provider: "OpenAI", tokensUsedToday: 242600, percentageOfTotal: 50, costUsd: 7.42 },
  { provider: "Anthropic", tokensUsedToday: 145500, percentageOfTotal: 30, costUsd: 4.45 },
  { provider: "Google", tokensUsedToday: 97100, percentageOfTotal: 20, costUsd: 2.98 },
];

const INITIAL_DAILY_TREND: DailyUsageTrendItem[] = [
  { date: "2026-08-03", tokens: 410000, costUsd: 12.5 },
  { date: "2026-08-04", tokens: 450000, costUsd: 13.8 },
  { date: "2026-08-05", tokens: 390000, costUsd: 11.9 },
  { date: "2026-08-06", tokens: 480000, costUsd: 14.6 },
  { date: "2026-08-07", tokens: 520000, costUsd: 15.9 },
  { date: "2026-08-08", tokens: 470000, costUsd: 14.3 },
  { date: "2026-08-09", tokens: 485200, costUsd: 14.85 },
];

const INITIAL_SQUAD_USAGE: SquadUsageItem[] = [
  { squad: "Monitors", tokensUsedToday: 60000, percentageOfTotal: 12, costUsd: 1.79 },
  { squad: "Detectors", tokensUsedToday: 89000, percentageOfTotal: 18, costUsd: 3.12 },
  { squad: "Verification", tokensUsedToday: 190000, percentageOfTotal: 39, costUsd: 7.0 },
  { squad: "Pipeline", tokensUsedToday: 146200, percentageOfTotal: 31, costUsd: 5.07 },
];

export default function QuotaMonitorPage(): React.JSX.Element {
  const [agents, setAgents] = useState<AgentQuotaItem[]>(INITIAL_AGENT_QUOTAS);
  const [squadFilter, setSquadFilter] = useState<string>("ALL");
  const [providerFilter, setProviderFilter] = useState<string>("ALL");
  const [timePeriod, setTimePeriod] = useState<string>("today");
  const [showAdjustModal, setShowAdjustModal] = useState<AgentQuotaItem | null>(null);
  const [newLimitInput, setNewLimitInput] = useState<number>(100000);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function fetchQuotas() {
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
          setError(resp.error?.message || "Failed to load quota telemetry from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuotas();
  }, []);

  const handleAdjustLimit = (agent: AgentQuotaItem) => {
    setAgents(
      agents.map((a) => {
        if (a.agentId !== agent.agentId) return a;
        const newStatus =
          a.tokensUsedToday > newLimitInput
            ? "EXCEEDED"
            : a.tokensUsedToday > newLimitInput * 0.8
            ? "WARNING"
            : "OK";
        return {
          ...a,
          dailyTokenLimit: newLimitInput,
          rateLimitStatus: newStatus as const,
        };
      }),
    );
    setShowAdjustModal(null);
    alert(`Daily token limit for ${agent.agentId} adjusted to ${newLimitInput.toLocaleString()}!`);
  };

  const filteredAgents = agents.filter((ag) => {
    if (squadFilter !== "ALL" && ag.squad !== squadFilter) {
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
        <div className="h-64 w-full animate-pulse rounded-lg bg-[#12121A]" />
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">Token Quota Monitor</h2>
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
            Quota Telemetry Retrieval Failed
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
            Retry Quota Retrieval
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
              Token Usage Quota Monitor
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              Per-agent rate limits, cost estimates, and provider token distribution
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filters visible */}
        <QuotaFilterBar
          squadFilter={squadFilter}
          onSquadChange={setSquadFilter}
          providerFilter={providerFilter}
          onProviderChange={setProviderFilter}
          timePeriod={timePeriod}
          onTimePeriodChange={setTimePeriod}
          onReset={() => {
            setSquadFilter("ALL");
            setProviderFilter("ALL");
            setTimePeriod("today");
          }}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No agent token usage matches your filters
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {squadFilter !== "ALL" || providerFilter !== "ALL"
              ? "Zero agents in the selected squad or provider have recorded token usage."
              : "Zero token usage has been recorded across the 32-agent fleet today."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setSquadFilter("ALL");
                setProviderFilter("ALL");
                setTimePeriod("today");
                setAgents(INITIAL_AGENT_QUOTAS);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Reset Filters &amp; Load Quotas
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Token Quota &amp; Cost Monitor
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Real-time usage telemetry across OpenAI, Anthropic, Google Gemini, and 32-agent squads
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setAgents(INITIAL_AGENT_QUOTAS)}
            className="rounded-md border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC]"
          >
            ↻ Refresh Telemetry
          </button>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Overview Metric Cards (3 columns) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Total Tokens Today
            </span>
            <span className="rounded-full bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF]">
              48.5% Limit
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#FAFAFA]">
            485,200 <span className="text-xs font-normal text-[#A0A4A8]">/ 1.0M limit</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            32-agent fleet aggregated consumption
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Total Tokens This Month
            </span>
            <span className="rounded-full bg-[#6C5CE7]/20 px-2 py-0.5 text-[10px] font-bold text-[#6C5CE7]">
              48.2% Limit
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#FAFAFA]">
            14,450,000 <span className="text-xs font-normal text-[#A0A4A8]">/ 30.0M limit</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Monthly contract RLS tenant cap
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              Estimated Today Cost
            </span>
            <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              USD ($)
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#0D9040]">
            $14.85 <span className="text-xs font-normal text-[#A0A4A8]">USD</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Aggregated across 3 LLM providers
          </div>
        </div>
      </div>

      {/* Filters */}
      <QuotaFilterBar
        squadFilter={squadFilter}
        onSquadChange={setSquadFilter}
        providerFilter={providerFilter}
        onProviderChange={setProviderFilter}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
        onReset={() => {
          setSquadFilter("ALL");
          setProviderFilter("ALL");
          setTimePeriod("today");
        }}
      />

      {/* Visual Chart Deck: QuotaChart (Bar / Trend / Squad Distribution) */}
      <QuotaChart
        providerUsage={INITIAL_PROVIDER_USAGE}
        dailyTrend={INITIAL_DAILY_TREND}
        squadUsage={INITIAL_SQUAD_USAGE}
      />

      {/* Per-Agent Quota Breakdown Table */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] shadow">
        <div className="flex items-center justify-between border-b border-[#2E2E32] bg-[#0A0A0B] px-4 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
            32-Agent Fleet Quota Ledger ({filteredAgents.length} agents shown)
          </h3>
          <span className="text-xs text-[#A0A4A8]">
            Rate limit status: OK / WARNING / EXCEEDED
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#2E2E32] bg-[#0A0A0B] text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
                <th className="px-4 py-3">Agent Identifier &amp; Name</th>
                <th className="px-4 py-3">Squad</th>
                <th className="px-4 py-3">Tokens Used / Daily Limit</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Est. Cost</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E32]">
              {filteredAgents.map((ag) => (
                <AgentQuotaRow
                  key={ag.agentId}
                  agent={ag}
                  onAdjustLimit={(a) => {
                    setNewLimitInput(a.dailyTokenLimit);
                    setShowAdjustModal(a);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Agent Limit Modal */}
      {showAdjustModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-bold text-[#FAFAFA]">
              Adjust Daily Token Quota Limit: {showAdjustModal.agentId}
            </h3>
            <p className="mb-4 text-xs text-[#A0A4A8]">
              Agent: <span className="font-bold text-[#FAFAFA]">{showAdjustModal.agentName}</span> ({showAdjustModal.squad})
            </p>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#FAFAFA]">
                New Daily Token Limit
              </label>
              <input
                type="number"
                step="5000"
                min="10000"
                max="5000000"
                value={newLimitInput}
                onChange={(e) => setNewLimitInput(parseInt(e.target.value, 10) || 100000)}
                className="w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] focus:border-[#0066CC] focus:outline-none"
              />
              <p className="text-[11px] text-[#A0A4A8]">
                Current consumption today: {showAdjustModal.tokensUsedToday.toLocaleString()} tokens.
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAdjustModal(null)}
                className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAdjustLimit(showAdjustModal)}
                className="rounded bg-[#0066CC] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
              >
                Save Quota Limit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface QuotaFilterBarProps {
  squadFilter: string;
  onSquadChange: (val: string) => void;
  providerFilter: string;
  onProviderChange: (val: string) => void;
  timePeriod: string;
  onTimePeriodChange: (val: string) => void;
  onReset: () => void;
}

function QuotaFilterBar({
  squadFilter,
  onSquadChange,
  providerFilter,
  onProviderChange,
  timePeriod,
  onTimePeriodChange,
  onReset,
}: QuotaFilterBarProps): React.JSX.Element {
  const isFiltered =
    squadFilter !== "ALL" || providerFilter !== "ALL" || timePeriod !== "today";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Squad Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Squad:</label>
          <select
            value={squadFilter}
            onChange={(e) => onSquadChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All 4 Squads (32 Agents)</option>
            <option value="Monitors">Monitors (AGT-001–008)</option>
            <option value="Detectors">Detectors (AGT-009–016)</option>
            <option value="Verification">Verification (AGT-017–024)</option>
            <option value="Pipeline">Pipeline (AGT-025–032)</option>
          </select>
        </div>

        {/* Provider Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Provider:</label>
          <select
            value={providerFilter}
            onChange={(e) => onProviderChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Providers</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Anthropic">Anthropic</option>
            <option value="Google">Google Gemini</option>
          </select>
        </div>

        {/* Time Period Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Period:</label>
          <select
            value={timePeriod}
            onChange={(e) => onTimePeriodChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="today">Today (2026-08-09)</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
        >
          ✕ Clear Quota Filters
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
