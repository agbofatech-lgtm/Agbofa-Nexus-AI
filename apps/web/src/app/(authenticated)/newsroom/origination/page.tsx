"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { callRpc } from "../../../../lib/bff/client";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { StoryList, ColumnConfig } from "../components/story-list";
import { StoryListRowModel } from "../components/story-row";
import { OriginationPriority, OriginationStatus } from "../types";

const INITIAL_STORIES: StoryListRowModel[] = [
  {
    id: "orig-101",
    headline: "Autonomous AI Newsroom Workforce Expands Across Regions",
    sourcePlatform: "Twitter/X",
    sourceName: "@reuters_tech",
    detectedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    status: "NEW",
    priority: "BREAKING",
    assignedTo: "Unassigned",
  },
  {
    id: "orig-102",
    headline: "Predictive Intelligence Engines Scale Calibration Metrics",
    sourcePlatform: "LinkedIn",
    sourceName: "Tech Enterprise Wire",
    detectedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    status: "PROCESSING",
    priority: "HIGH",
    assignedTo: "editor@agbofa.com",
  },
  {
    id: "orig-103",
    headline: "Row-Level Security Enforces Strict Tenant Boundaries in Postgres",
    sourcePlatform: "RSS",
    sourceName: "AP Wire Feed",
    detectedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    status: "ROUTED",
    priority: "STANDARD",
    assignedTo: "senior-editor",
  },
  {
    id: "orig-104",
    headline: "Enterprise AI Gateway Extension Adds Multimodal Consistency Check",
    sourcePlatform: "Reddit",
    sourceName: "r/machinelearning",
    detectedAt: new Date(Date.now() - 240 * 60000).toISOString(),
    status: "NEW",
    priority: "LOW",
    assignedTo: "Unassigned",
  },
];

const COLUMNS: ColumnConfig[] = [
  { key: "sourcePlatform", label: "Source / Platform", sortable: true },
  { key: "headline", label: "Headline & Source", sortable: true },
  { key: "detectedAt", label: "Detected At", sortable: true },
  { key: "priority", label: "Priority", sortable: true },
  { key: "status", label: "Status", sortable: true },
];

export default function OriginationQueuePage(): React.JSX.Element {
  const router = useRouter();
  const [stories, setStories] = useState<StoryListRowModel[]>(INITIAL_STORIES);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<string>("TODAY");

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function loadOrigination() {
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
          setError(resp.error?.message || "Failed to load origination queue from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrigination();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredStories.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleRowAction = (action: string, story: StoryListRowModel) => {
    if (action === "ROUTE") {
      router.push("/newsroom/truth");
    } else if (action === "ASSIGN") {
      const updated = stories.map((s) =>
        s.id === story.id ? { ...s, assignedTo: "editor@agbofa.com", status: "PROCESSING" } : s,
      );
      setStories(updated);
    }
  };

  const handleBulkRoute = () => {
    if (selectedIds.length === 0) return;
    const updated = stories.map((s) =>
      selectedIds.includes(s.id) ? { ...s, status: "ROUTED" } : s,
    );
    setStories(updated);
    setSelectedIds([]);
  };

  const handleBulkPriority = (priority: OriginationPriority) => {
    if (selectedIds.length === 0) return;
    const updated = stories.map((s) =>
      selectedIds.includes(s.id) ? { ...s, priority } : s,
    );
    setStories(updated);
  };

  const filteredStories = stories.filter((st) => {
    if (platformFilter !== "ALL" && st.sourcePlatform !== platformFilter) {
      return false;
    }
    if (statusFilter !== "ALL" && st.status !== statusFilter) {
      return false;
    }
    if (priorityFilter !== "ALL" && st.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-64 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-[#12121A]" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[#12121A]" />
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">Origination Queue</h2>
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
            Origination Queue Retrieval Failed
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
            Retry Retrieval
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (
    simulateMode === "empty" ||
    (!isLoading && filteredStories.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              Content Origination Queue
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              Manage incoming signals and feeds from 32-agent social &amp; wire monitors
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter bar still visible */}
        <FilterBar
          platformFilter={platformFilter}
          onPlatformChange={setPlatformFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onReset={() => {
            setPlatformFilter("ALL");
            setStatusFilter("ALL");
            setPriorityFilter("ALL");
          }}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No stories in origination queue
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {platformFilter !== "ALL" || statusFilter !== "ALL" || priorityFilter !== "ALL"
              ? "Zero incoming stories match your active platform, priority, or status filters."
              : "The origination queue is currently empty. All detected signals have been routed to verification."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setPlatformFilter("ALL");
                setStatusFilter("ALL");
                setPriorityFilter("ALL");
                setStories(INITIAL_STORIES);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Reset Filters &amp; Load Stories
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-6">
      {/* Top Title & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Content Origination Queue ({filteredStories.length} items)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Incoming signals from Twitter/X, Facebook, LinkedIn, RSS, and wire services
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setStories(INITIAL_STORIES)}
            className="rounded-md border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC]"
          >
            ↻ Refresh Feed
          </button>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        platformFilter={platformFilter}
        onPlatformChange={setPlatformFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onReset={() => {
          setPlatformFilter("ALL");
          setStatusFilter("ALL");
          setPriorityFilter("ALL");
        }}
      />

      {/* Batch / Bulk Actions Bar (visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#0066CC]/50 bg-[#0066CC]/10 p-3 text-xs">
          <span className="font-semibold text-[#3399FF]">
            {selectedIds.length} story/stories selected
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-[#A0A4A8]">Set Priority:</span>
            {(["BREAKING", "HIGH", "STANDARD", "LOW"] as OriginationPriority[]).map(
              (pri) => (
                <button
                  key={pri}
                  type="button"
                  onClick={() => handleBulkPriority(pri)}
                  className="rounded bg-[#12121A] px-2 py-1 text-[11px] font-bold text-[#FAFAFA] border border-[#2E2E32] hover:border-[#0066CC]"
                >
                  {pri}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={handleBulkRoute}
              className="rounded bg-[#0066CC] px-3 py-1 font-semibold text-white hover:bg-[#3399FF]"
            >
              Route Selected to Verification →
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-[#CF2020] hover:underline"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Story List Table / Card Queue */}
      <StoryList
        stories={filteredStories}
        columns={COLUMNS}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        onRowClick={(st) => router.push("/newsroom/truth")}
        onAction={handleRowAction}
        emptyTitle="No origination stories match your filters"
        emptyDescription="Try clearing platform or priority filters to see all incoming signals."
      />
    </div>
  );
}

interface FilterBarProps {
  platformFilter: string;
  onPlatformChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  priorityFilter: string;
  onPriorityChange: (val: string) => void;
  dateRange: string;
  onDateRangeChange: (val: string) => void;
  onReset: () => void;
}

function FilterBar({
  platformFilter,
  onPlatformChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  dateRange,
  onDateRangeChange,
  onReset,
}: FilterBarProps): React.JSX.Element {
  const isFiltered =
    platformFilter !== "ALL" || statusFilter !== "ALL" || priorityFilter !== "ALL";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Platform Dropdown */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Platform:</label>
          <select
            value={platformFilter}
            onChange={(e) => onPlatformChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Platforms</option>
            <option value="Twitter/X">Twitter/X</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="RSS">RSS / Wire</option>
            <option value="Reddit">Reddit</option>
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="ROUTED">ROUTED</option>
          </select>
        </div>

        {/* Priority Dropdown */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Priorities</option>
            <option value="BREAKING">BREAKING</option>
            <option value="HIGH">HIGH</option>
            <option value="STANDARD">STANDARD</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        {/* Date Range Picker / Selector */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Date:</label>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="TODAY">Today (2026-08-09)</option>
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
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
