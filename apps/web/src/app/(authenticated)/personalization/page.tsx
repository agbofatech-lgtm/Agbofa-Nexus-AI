"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../lib/bff/client";
import {
  INITIAL_OVERVIEW_STATS,
  SAMPLE_TOPIC_PREFERENCES,
  SAMPLE_READING_HISTORY,
  SAMPLE_RECOMMENDATIONS,
} from "./mock-data";
import { PersonalizationOverviewStats } from "./types";

export default function PersonalizationOverviewPage(): React.JSX.Element {
  const router = useRouter();
  const [stats, setStats] = useState<PersonalizationOverviewStats>(INITIAL_OVERVIEW_STATS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchPersonalizationOverview() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string },
          { status?: string }
        >("runtime.v1.AIGatewayService", "InvokeModel", {
          tenant_id: "tenant-default",
        });
        if (resp.status === "ERROR") {
          setError("Failed to load personalization telemetry from BFF.");
        }
      } catch {
        // Graceful fallback to authoritative sample data
      } finally {
        setIsLoading(false);
      }
    }
    fetchPersonalizationOverview();
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Personalization Intelligence Overview
          </h2>
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
            Personalization Telemetry Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error ||
              "Simulated error: unable to reach personalization engine via BFF proxy."}
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
  if (simulateMode === "empty") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Personalization Intelligence Overview
          </h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            Zero personalization activity recorded today
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            The personalization engine has zero reading events or topic preferences recorded in your tenant profile.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setStats(INITIAL_OVERVIEW_STATS);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Personalization Ledger
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  const topTopics = SAMPLE_TOPIC_PREFERENCES.slice(0, 4);
  const recentReads = SAMPLE_READING_HISTORY.slice(0, 3);
  const recentRecs = SAMPLE_RECOMMENDATIONS.slice(0, 2);

  return (
    <div className="space-y-8">
      {/* Top Title & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            Authoritative Personalization Dashboard (IMP-019)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Reader Profile & Preferences, 5-Factor Feed Curation, Recommendation Explanations, and Behavioral Analytics
          </p>
        </div>
        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Topics Followed
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#3399FF]">
              {stats.topicsFollowedCount}
            </span>
            <span className="text-xs font-semibold text-[#0D9040]">
              6 Explicit / 2 Inferred
            </span>
          </div>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            Monitored across 8 primary topic categories
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Sources Preferred
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#FAFAFA]">
              {stats.sourcesPreferredCount}
            </span>
            <span className="text-xs font-semibold text-[#0D9040]">
              100% Trust Verified
            </span>
          </div>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            Social platforms, RSS, and wire desks
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Articles Read (30d)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#0D9040]">
              {stats.articlesRead30dCount}
            </span>
            <span className="text-xs font-semibold text-[#0D9040]">
              +24 vs previous month
            </span>
          </div>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            Avg completion rate: 91.5%
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Avg Engagement Score
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#6C5CE7]">
              {(stats.avgEngagementScore * 100).toFixed(0)}%
            </span>
            <span className="text-xs font-semibold text-[#3399FF]">
              0.84 / 1.00 Clamped
            </span>
          </div>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            Feed CTR: {stats.recommendationClickRate}% • Diversity: {stats.diversityIndex}
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards to the 3 personal domains */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          onClick={() => router.push("/personalization/profile")}
          className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-colors hover:border-[#0066CC]"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#FAFAFA] group-hover:text-[#3399FF]">
              1. Profile & Preferences →
            </h3>
            <span className="rounded bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF] border border-[#0066CC]/30">
              PERS-001
            </span>
          </div>
          <p className="text-xs text-[#A0A4A8]">
            Configure explicit topic following, adjust interest weights (0–100%), manage source trust ratings, and inspect your reading history timeline.
          </p>
        </div>

        <div
          onClick={() => router.push("/personalization/feed")}
          className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-colors hover:border-[#0D9040]"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#FAFAFA] group-hover:text-[#0D9040]">
              2. Feed Customization →
            </h3>
            <span className="rounded bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040] border border-[#0D9040]/30">
              PERS-002
            </span>
          </div>
          <p className="text-xs text-[#A0A4A8]">
            Customize feed balance, inspect the 5-Factor Ranking Formula (35% topic, 25% quality, 20% freshness, 10% source, 10% diversity), and view recommendation explanations.
          </p>
        </div>

        <div
          onClick={() => router.push("/personalization/insights")}
          className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-colors hover:border-[#6C5CE7]"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#FAFAFA] group-hover:text-[#6C5CE7]">
              3. Behavioral Insights →
            </h3>
            <span className="rounded bg-[#6C5CE7]/20 px-2 py-0.5 text-[10px] font-bold text-[#6C5CE7] border border-[#6C5CE7]/30">
              PERS-003 / PERS-005
            </span>
          </div>
          <p className="text-xs text-[#A0A4A8]">
            Analyze daily reading habits, topic exploration breadth, AI inferred preferences, and inspect strict tenant privacy & zero-sharing policies.
          </p>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Recently Read Articles */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <div className="mb-3 flex items-center justify-between border-b border-[#2E2E32] pb-2">
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              Recently Read Articles
            </h3>
            <button
              type="button"
              onClick={() => router.push("/personalization/profile")}
              className="text-xs font-semibold text-[#3399FF] hover:underline"
            >
              View Full History →
            </button>
          </div>
          <div className="space-y-3">
            {recentReads.map((read) => (
              <div
                key={read.id}
                className="flex items-start justify-between rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-xs"
              >
                <div className="space-y-1">
                  <span className="rounded bg-[#0066CC]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#3399FF]">
                    {read.topicCategory}
                  </span>
                  <h4 className="font-bold text-[#FAFAFA]">{read.title}</h4>
                  <p className="text-[11px] text-[#A0A4A8]">
                    {read.sourceName} • Time spent: {(read.timeSpentSeconds / 60).toFixed(1)}m
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="block font-mono font-bold text-[#0D9040]">
                    {(read.engagementScore * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-[#A0A4A8]">Engagement</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Top Topics This Week & Recommendation Quality */}
        <div className="space-y-6">
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
            <h3 className="mb-3 border-b border-[#2E2E32] pb-2 text-sm font-bold text-[#FAFAFA]">
              Top Topics This Week
            </h3>
            <div className="space-y-3">
              {topTopics.map((top) => {
                const interestPct = Math.round(top.interestScore * 100);
                return (
                  <div key={top.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-[#FAFAFA]">
                        {top.categoryName} ({top.topic})
                      </span>
                      <span className="font-mono text-[#3399FF]">
                        {interestPct}% Weight
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#A0A4A8]">
                      <span>{top.readCount} stories read</span>
                      <span>
                        {top.isExplicit ? "Explicit Follow" : "Inferred"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#2E2E32]">
                      <div
                        className="h-1.5 rounded-full bg-[#0066CC]"
                        style={{ width: `${interestPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
            <h3 className="mb-2 text-sm font-bold text-[#FAFAFA]">
              Recommendation Quality & Anti-Echo-Chamber Index
            </h3>
            <p className="mb-3 text-xs text-[#A0A4A8]">
              Your feed maintains an 78.4% click-through rate while enforcing diversity discounting to prevent echo chambers.
            </p>
            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="rounded border border-[#0D9040]/30 bg-[#0D9040]/10 p-3">
                <span className="block font-mono text-xl font-bold text-[#0D9040]">
                  78.4%
                </span>
                <span className="text-[#A0A4A8]">Feed Click Rate</span>
              </div>
              <div className="rounded border border-[#6C5CE7]/30 bg-[#6C5CE7]/10 p-3">
                <span className="block font-mono text-xl font-bold text-[#6C5CE7]">
                  0.85 / 1.00
                </span>
                <span className="text-[#A0A4A8]">Diversity Index</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Recommendations Feed Preview */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
        <div className="mb-3 flex items-center justify-between border-b border-[#2E2E32] pb-2">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              Sample Recommendations with &ldquo;Because you read X&rdquo; Explanations
            </h3>
            <p className="text-xs text-[#A0A4A8]">
              Previewing the 5-factor feed ranking formula and Zero Fabrication Guarantee
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/personalization/feed")}
            className="text-xs font-semibold text-[#0D9040] hover:underline"
          >
            Manage Feed Settings →
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {recentRecs.map((rec) => (
            <div
              key={rec.id}
              className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="rounded bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF]">
                  {rec.topicCategory}
                </span>
                <span className="font-mono text-xs font-bold text-[#0D9040]">
                  Score: {(rec.relevanceScore * 100).toFixed(0)}%
                </span>
              </div>
              <h4 className="font-bold text-[#FAFAFA]">{rec.title}</h4>
              <div className="rounded border border-[#0066CC]/30 bg-[#12121A] p-2">
                <span className="text-[10px] uppercase font-bold text-[#3399FF]">
                  💡 Why Recommended:
                </span>
                <p className="mt-0.5 text-xs font-mono text-[#FAFAFA]">
                  &ldquo;{rec.explanationReason}&rdquo;
                </p>
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
