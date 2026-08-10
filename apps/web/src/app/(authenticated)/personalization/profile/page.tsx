"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { TopicPreferences } from "../components/topic-preferences";
import { SourcePreferences } from "../components/source-preferences";
import { ReadingHistory } from "../components/reading-history";
import {
  SAMPLE_TOPIC_PREFERENCES,
  SAMPLE_SOURCE_PREFERENCES,
  SAMPLE_READING_HISTORY,
} from "../mock-data";
import {
  TopicPreferenceItem,
  SourcePreferenceItem,
  ReadingHistoryItem,
  SourceTrustTier,
} from "../types";

export default function ReaderProfilePreferencesPage(): React.JSX.Element {
  const [topics, setTopics] = useState<TopicPreferenceItem[]>(SAMPLE_TOPIC_PREFERENCES);
  const [sources, setSources] = useState<SourcePreferenceItem[]>(SAMPLE_SOURCE_PREFERENCES);
  const [history, setHistory] = useState<ReadingHistoryItem[]>(SAMPLE_READING_HISTORY);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  const [activeTab, setActiveTab] = useState<"topics" | "sources" | "history">("topics");

  useEffect(() => {
    async function fetchReaderProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string; reader_id?: string },
          { status?: string }
        >("runtime.v1.AIGatewayService", "InvokeModel", {
          tenant_id: "tenant-default",
          reader_id: "editor-default",
        });
        if (resp.status === "ERROR") {
          setError("Failed to retrieve reader profile ledger from BFF.");
        }
      } catch {
        // Fallback to sample preferences
      } finally {
        setIsLoading(false);
      }
    }
    fetchReaderProfile();
  }, []);

  const handleToggleFollow = (topicId: string) => {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, isFollowed: !t.isFollowed } : t,
      ),
    );
  };

  const handleChangeInterestScore = (topicId: string, newScore: number) => {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId
          ? { ...t, interestScore: Math.max(0, Math.min(1, newScore)) }
          : t,
      ),
    );
  };

  const handleChangePreferenceScore = (sourceId: string, newScore: number) => {
    setSources((prev) =>
      prev.map((s) =>
        s.id === sourceId
          ? { ...s, preferenceScore: Math.max(0, Math.min(1, newScore)) }
          : s,
      ),
    );
  };

  const handleChangeTrustRating = (sourceId: string, newRating: SourceTrustTier) => {
    const displays: Record<SourceTrustTier, string> = {
      HIGH_TRUST: "High Trust ★★★★★",
      VERIFIED: "Verified ★★★★☆",
      NEUTRAL: "Neutral ★★★☆☆",
      RESTRICTED: "Restricted ★★☆☆☆",
    };
    setSources((prev) =>
      prev.map((s) =>
        s.id === sourceId
          ? { ...s, trustRating: newRating, trustScoreDisplay: displays[newRating] }
          : s,
      ),
    );
  };

  const handleClearHistory = () => {
    if (confirm("Clear your reading history? This will stop reinforcement of inferred preferences.")) {
      setHistory([]);
    }
  };

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-96 w-full animate-pulse rounded-lg bg-[#12121A]" />
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Reader Profile & Preferences (PERS-001)
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
            Reader Profile Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error || "Simulated error: unable to load reader profile ledger via BFF."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "error") setSimulateMode("normal");
              else window.location.reload();
            }}
            className="rounded-md bg-[#CF2020] px-4 py-2 text-xs font-semibold text-[#FAFAFA]"
          >
            Retry Loading Profile
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (
    simulateMode === "empty" ||
    (topics.length === 0 && sources.length === 0 && history.length === 0)
  ) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Reader Profile & Preferences (PERS-001)
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
            Zero reader profile preferences recorded
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            You have not followed any topics or sources, and your reading history ledger is empty.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setTopics(SAMPLE_TOPIC_PREFERENCES);
                setSources(SAMPLE_SOURCE_PREFERENCES);
                setHistory(SAMPLE_READING_HISTORY);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Profile Ledger
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-6">
      {/* Top Header & Sub-tab navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-3">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            Reader Profile & Preferences Management (PERS-001)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Tenant-isolated profile storing explicit follow ledgers, implicit interest scores, and 30-day time-decay reading history
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex rounded-md border border-[#2E2E32] bg-[#12121A] p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("topics")}
              className={`rounded px-3 py-1 transition-colors ${
                activeTab === "topics"
                  ? "bg-[#0066CC] text-white"
                  : "text-[#A0A4A8] hover:text-[#FAFAFA]"
              }`}
            >
              Topic Preferences ({topics.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sources")}
              className={`rounded px-3 py-1 transition-colors ${
                activeTab === "sources"
                  ? "bg-[#0066CC] text-white"
                  : "text-[#A0A4A8] hover:text-[#FAFAFA]"
              }`}
            >
              Source Preferences ({sources.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`rounded px-3 py-1 transition-colors ${
                activeTab === "history"
                  ? "bg-[#0066CC] text-white"
                  : "text-[#A0A4A8] hover:text-[#FAFAFA]"
              }`}
            >
              Reading History ({history.length})
            </button>
          </div>

          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Render selected domain view */}
      {activeTab === "topics" && (
        <TopicPreferences
          topics={topics}
          onToggleFollow={handleToggleFollow}
          onChangeInterestScore={handleChangeInterestScore}
        />
      )}

      {activeTab === "sources" && (
        <SourcePreferences
          sources={sources}
          onChangePreferenceScore={handleChangePreferenceScore}
          onChangeTrustRating={handleChangeTrustRating}
        />
      )}

      {activeTab === "history" && (
        <ReadingHistory
          history={history}
          onClearHistory={handleClearHistory}
        />
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
