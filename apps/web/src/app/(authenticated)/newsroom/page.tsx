"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../lib/bff/client";
import { NewsroomStats } from "./components/newsroom-stats";
import { PipelineStats, NewsroomActivityItem } from "./types";

const INITIAL_STATS: PipelineStats = {
  originationCount: 14,
  verificationCount: 6,
  factoryCount: 8,
  reviewCount: 4,
  publishedToday: 23,
  publishedTrendChange: 15,
};

const SAMPLE_ACTIVITIES: NewsroomActivityItem[] = [
  {
    activityId: "act-1",
    actor: "AGT-017 Fact-Check Agent",
    action: "Verified all claims and assigned verdict TRUE",
    targetId: "story-101",
    targetTitle: "Autonomous AI Newsroom Workforce Expands",
    occurredAt: new Date(Date.now() - 15 * 60000).toISOString(),
    stage: "VERIFICATION",
  },
  {
    activityId: "act-2",
    actor: "ContentFactoryService (AGT-026)",
    action: "Generated multi-channel social & article package",
    targetId: "pkg-102",
    targetTitle: "Predictive Intelligence Engines Scale Calibration",
    occurredAt: new Date(Date.now() - 42 * 60000).toISOString(),
    stage: "FACTORY",
  },
  {
    activityId: "act-3",
    actor: "Senior Editor (Agbofa Newsroom)",
    action: "Approved package for multi-channel distribution",
    targetId: "pkg-103",
    targetTitle: "Row-Level Security Enforces Strict Tenant Boundaries",
    occurredAt: new Date(Date.now() - 90 * 60000).toISOString(),
    stage: "REVIEW",
  },
  {
    activityId: "act-4",
    actor: "AGT-001 Twitter/X Monitor",
    action: "Ingested breaking signal with priority BREAKING",
    targetId: "story-104",
    targetTitle: "Global AI Compute Cluster Exceeds Performance Targets",
    occurredAt: new Date(Date.now() - 120 * 60000).toISOString(),
    stage: "ORIGINATION",
  },
];

export default function NewsroomDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const [stats, setStats] = useState<PipelineStats>(INITIAL_STATS);
  const [activities, setActivities] = useState<NewsroomActivityItem[]>(SAMPLE_ACTIVITIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setError(null);
      try {
        const factResp = await callRpc<
          { tenant_id: string; status_filter: string },
          { packages?: unknown[] }
        >("content_factory.v1.ContentFactoryService", "ListPackages", {
          tenant_id: "tenant-default",
          status_filter: "APPROVED",
        });

        if (factResp.status === "ERROR") {
          setError(factResp.error?.message || "Failed to load dashboard data from BFF.");
        } else {
          setStats((prev) => ({
            ...prev,
            factoryCount:
              factResp.data?.packages?.length || INITIAL_STATS.factoryCount,
          }));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-[#2E2E32] bg-[#12121A]"
            />
          ))}
        </div>
        <div className="h-64 w-full animate-pulse rounded-lg border border-[#2E2E32] bg-[#12121A]" />
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">Dashboard Overview</h2>
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
            Newsroom Dashboard Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error || "Simulated error: unable to reach ContentFactoryService via BFF."}
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">Dashboard Overview</h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No recent activity recorded
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            The newsroom pipeline currently has zero activity logged across origination, verification, and editorial review.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setActivities(SAMPLE_ACTIVITIES);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Pipeline Activity
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-8">
      {/* Top Header & Simulation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            Real-Time Content Lifecycle Dashboard
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative status across News Gathering, Fact Verification, Packaging, and Review
          </p>
        </div>
        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* Pipeline Statistics Bar */}
      <NewsroomStats stats={stats} />

      {/* Quick Workspace Navigation Cards (4 columns desktop, 2 tablet, 1 mobile) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
          Quick Workspace Navigation
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div
            onClick={() => router.push("/newsroom/origination")}
            className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-all hover:border-[#0066CC] hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF]">
                STAGE 1
              </span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <h4 className="text-sm font-bold text-[#FAFAFA] group-hover:text-[#3399FF]">
              Origination Queue ({stats.originationCount})
            </h4>
            <p className="mt-1 text-xs text-[#A0A4A8]">
              Monitor wire feeds, social signals, and assign priority to incoming items.
            </p>
          </div>

          <div
            onClick={() => router.push("/newsroom/truth")}
            className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-all hover:border-[#6C5CE7] hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded bg-[#6C5CE7]/20 px-2 py-0.5 text-[10px] font-bold text-[#6C5CE7]">
                STAGE 2
              </span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <h4 className="text-sm font-bold text-[#FAFAFA] group-hover:text-[#6C5CE7]">
              Truth Verification ({stats.verificationCount})
            </h4>
            <p className="mt-1 text-xs text-[#A0A4A8]">
              Verify factual claims, evidence ledgers, misinformation risks, and bias.
            </p>
          </div>

          <div
            onClick={() => router.push("/newsroom/factory")}
            className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-all hover:border-[#3399FF] hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded bg-[#2E2E32] px-2 py-0.5 text-[10px] font-bold text-[#FAFAFA]">
                STAGE 3
              </span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <h4 className="text-sm font-bold text-[#FAFAFA] group-hover:text-[#3399FF]">
              Content Factory ({stats.factoryCount})
            </h4>
            <p className="mt-1 text-xs text-[#A0A4A8]">
              Assemble multi-channel packages, check brand voice compatibility, and edit assets.
            </p>
          </div>

          <div
            onClick={() => router.push("/newsroom/review")}
            className="group cursor-pointer rounded-lg border border-amber-500/30 bg-[#12121A] p-5 transition-all hover:border-amber-400 hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                STAGE 4
              </span>
              <span className="text-xs text-[#A0A4A8]">→</span>
            </div>
            <h4 className="text-sm font-bold text-[#FAFAFA] group-hover:text-amber-400">
              Editorial Review ({stats.reviewCount})
            </h4>
            <p className="mt-1 text-xs text-[#A0A4A8]">
              Approve, reject, or request revisions on assembled content packages.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <div className="mb-4 flex items-center justify-between border-b border-[#2E2E32] pb-3">
          <h3 className="text-sm font-bold text-[#FAFAFA]">
            Recent Pipeline Activity Feed
          </h3>
          <span className="text-xs text-[#A0A4A8]">
            Live updates from 32-agent fleet &amp; editorial team
          </span>
        </div>
        <div className="divide-y divide-[#2E2E32]">
          {activities.map((act) => (
            <div
              key={act.activityId}
              className="flex flex-col justify-between gap-2 py-3 text-xs sm:flex-row sm:items-center"
            >
              <div>
                <span className="font-bold text-[#3399FF]">{act.actor}</span>{" "}
                <span className="text-[#FAFAFA]">{act.action}</span>
                <div className="mt-0.5 text-[11px] text-[#A0A4A8]">
                  Target: <span className="font-semibold text-[#FAFAFA]">{act.targetTitle}</span> ({act.targetId})
                </div>
              </div>
              <div className="flex shrink-0 items-center space-x-2">
                <span className="rounded bg-[#0A0A0B] px-2 py-0.5 text-[10px] font-semibold text-[#A0A4A8] border border-[#2E2E32]">
                  {act.stage}
                </span>
                <span className="text-[11px] text-[#A0A4A8]">
                  {new Date(act.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
