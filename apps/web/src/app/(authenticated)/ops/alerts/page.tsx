"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { AlertRow } from "../components/alert-row";
import { AlertHistoryItem } from "../types";

const INITIAL_ALERT_HISTORY: AlertHistoryItem[] = [
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
    timeline: [
      {
        timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
        event: "MAPE error metric drifted from 4.2% to 9.5% on viral dataset.",
      },
    ],
  },
  {
    id: "alt-103",
    severity: "WARNING",
    type: "AGENT_OFFLINE",
    message: "Social monitor adapter latency spike on Reddit connector",
    affectedServiceOrAgent: "AGT-006 Reddit Platform Monitor",
    occurredAt: new Date(Date.now() - 95 * 60000).toISOString(),
    status: "ACKNOWLEDGED",
    timeline: [
      {
        timestamp: new Date(Date.now() - 95 * 60000).toISOString(),
        event: "Reddit OAuth rate-limit retry backoff activated.",
      },
    ],
  },
  {
    id: "alt-104",
    severity: "CRITICAL",
    type: "PIPELINE_STALL",
    message: "Stage 3 verification queue depth exceeded 300 item threshold",
    affectedServiceOrAgent: "Verification Squad (AGT-017–024)",
    occurredAt: new Date(Date.now() - 180 * 60000).toISOString(),
    status: "ACTIVE",
    resolutionNotes: "Queue backpressure triggered bottleneck warning advisory.",
    timeline: [
      {
        timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
        event: "Queue depth reached 340 items; avg latency 840ms.",
      },
    ],
  },
  {
    id: "alt-105",
    severity: "INFO",
    type: "RLS_BYPASS",
    message: "Zero cross-tenant RLS violations across 16 PostgreSQL tables in 24h audit",
    affectedServiceOrAgent: "PostgreSQL Database Schema",
    occurredAt: new Date(Date.now() - 300 * 60000).toISOString(),
    status: "RESOLVED",
    resolutionNotes: "Automated nightly RLS security gate verified clean.",
    timeline: [
      {
        timestamp: new Date(Date.now() - 300 * 60000).toISOString(),
        event: "Security watchdog scan completed with 0 exceptions.",
      },
    ],
  },
];

export default function AlertHistoryPage(): React.JSX.Element {
  const [alerts, setAlerts] = useState<AlertHistoryItem[]>(INITIAL_ALERT_HISTORY);
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<string>("24h");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function fetchAlertHistory() {
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
          setError(resp.error?.message || "Failed to load alert history from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAlertHistory();
  }, []);

  const handleAction = (
    action: "ACKNOWLEDGE" | "ESCALATE" | "RESOLVE",
    id: string,
  ) => {
    setAlerts(
      alerts.map((a) => {
        if (a.id !== id) return a;
        if (action === "ACKNOWLEDGE") return { ...a, status: "ACKNOWLEDGED" as const };
        if (action === "RESOLVE") return { ...a, status: "RESOLVED" as const };
        if (action === "ESCALATE") {
          alert(`Alert ${id} escalated to On-Call Site Reliability Engineer (PagerDuty)!`);
        }
        return a;
      }),
    );
  };

  const handleAcknowledgeAll = () => {
    setAlerts(
      alerts.map((a) =>
        a.status === "ACTIVE" ? { ...a, status: "ACKNOWLEDGED" as const } : a,
      ),
    );
    alert("All ACTIVE alerts have been ACKNOWLEDGED.");
  };

  const filteredAlerts = alerts.filter((alt) => {
    if (severityFilter !== "ALL" && alt.severity !== severityFilter) {
      return false;
    }
    if (typeFilter !== "ALL" && alt.type !== typeFilter) {
      return false;
    }
    if (statusFilter !== "ALL" && alt.status !== statusFilter) {
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
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">Alert History Ledger</h2>
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
            Alert Ledger Retrieval Failed
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
    (!isLoading && filteredAlerts.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              Platform Alert History &amp; Diagnostic Ledger
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              Authoritative record across CRITICAL, WARNING, and INFO operational exceptions
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter bar visible */}
        <AlertFilterBar
          severityFilter={severityFilter}
          onSeverityChange={setSeverityFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onReset={() => {
            setSeverityFilter("ALL");
            setTypeFilter("ALL");
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
            No alerts match your filter criteria
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {severityFilter !== "ALL" || typeFilter !== "ALL" || statusFilter !== "ALL"
              ? "Zero alert records match your active severity, alert type, or resolution status filters."
              : "Zero system alerts have been logged in the selected time range."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setSeverityFilter("ALL");
                setTypeFilter("ALL");
                setStatusFilter("ALL");
                setAlerts(INITIAL_ALERT_HISTORY);
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
            Platform Alert History &amp; Diagnostic Ledger ({filteredAlerts.length} records)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Filter by severity, alert type, or resolution status; acknowledge, escalate, or resolve exceptions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleAcknowledgeAll}
            className="rounded-md bg-[#0066CC] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF] shadow"
          >
            ✓ Acknowledge All Active
          </button>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Filter Bar */}
      <AlertFilterBar
        severityFilter={severityFilter}
        onSeverityChange={setSeverityFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onReset={() => {
          setSeverityFilter("ALL");
          setTypeFilter("ALL");
          setStatusFilter("ALL");
        }}
      />

      {/* Alert Rows List */}
      <div className="space-y-4">
        {filteredAlerts.map((alt) => (
          <AlertRow key={alt.id} alert={alt} onAction={handleAction} />
        ))}
      </div>
    </div>
  );
}

interface AlertFilterBarProps {
  severityFilter: string;
  onSeverityChange: (val: string) => void;
  typeFilter: string;
  onTypeChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  dateRange: string;
  onDateRangeChange: (val: string) => void;
  onReset: () => void;
}

function AlertFilterBar({
  severityFilter,
  onSeverityChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  onReset,
}: AlertFilterBarProps): React.JSX.Element {
  const isFiltered =
    severityFilter !== "ALL" || typeFilter !== "ALL" || statusFilter !== "ALL";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
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
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Alert Types</option>
            <option value="AGENT_OFFLINE">AGENT OFFLINE</option>
            <option value="RATE_LIMIT">RATE LIMIT</option>
            <option value="ACCURACY_DEGRADATION">ACCURACY DEGRADATION</option>
            <option value="PIPELINE_STALL">PIPELINE STALL</option>
            <option value="RLS_BYPASS">RLS BYPASS</option>
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
            <option value="ACTIVE">ACTIVE</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Range:</label>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
        >
          ✕ Clear Alert Filters
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
