"use client";

import React, { useState } from "react";
import { ReadingHistoryItem } from "../types";

export interface ReadingHistoryProps {
  history: ReadingHistoryItem[];
  onClearHistory?: () => void;
}

export function ReadingHistory({
  history,
  onClearHistory,
}: ReadingHistoryProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("ALL");

  const topics = Array.from(new Set(history.map((h) => h.topicCategory)));

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic =
      selectedTopic === "ALL" || item.topicCategory === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  return (
    <div className="space-y-6">
      {/* Preference Decay Notice Card */}
      <div
        role="region"
        aria-label="Preference Decay Notice"
        className="flex items-start justify-between rounded-lg border border-[#0066CC]/40 bg-[#0066CC]/10 p-4"
      >
        <div className="flex items-start space-x-3">
          <span className="text-lg">⏳</span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#3399FF]">
              Time-Decay Preference Retention Policy (PERS-004)
            </h4>
            <p className="mt-0.5 text-xs text-[#FAFAFA]">
              Interests naturally decay if not reinforced. Keep reading to maintain your preferences.
            </p>
            <p className="mt-1 text-[11px] text-[#A0A4A8]">
              Older reads lose weighting exponentially over 30 days unless reinforced by fresh engagement signals.
            </p>
          </div>
        </div>
        {onClearHistory && (
          <button
            type="button"
            onClick={onClearHistory}
            className="rounded border border-[#2E2E32] bg-[#12121A] px-2.5 py-1 text-xs font-semibold text-[#CF2020] hover:bg-[#CF2020]/20 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3">
        <div className="flex flex-1 items-center space-x-2">
          <span className="text-xs text-[#A0A4A8]">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reading history by title or source..."
            className="w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1.5 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-medium text-[#A0A4A8]">Topic:</label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1.5 text-xs text-[#FAFAFA] focus:border-[#0066CC] focus:outline-none"
            aria-label="Filter reading history by topic"
          >
            <option value="ALL">All Topics</option>
            {topics.map((top) => (
              <option key={top} value={top}>
                {top}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline List */}
      {filteredHistory.length === 0 ? (
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center text-xs text-[#A0A4A8]">
          No reading history entries match your current search or filter criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => {
            const minSpent = (item.timeSpentSeconds / 60).toFixed(1);
            const engagePct = Math.round(item.engagementScore * 100);

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 transition-colors hover:border-[#0066CC]/40 sm:flex-row sm:items-center"
              >
                <div className="flex items-start space-x-3">
                  <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-[#0066CC]" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF] border border-[#0066CC]/30">
                        {item.topicCategory}
                      </span>
                      <span className="rounded bg-[#2E2E32] px-2 py-0.5 text-[10px] font-mono uppercase text-[#FAFAFA]">
                        {item.format}
                      </span>
                      <span className="text-[11px] text-[#A0A4A8]">
                        Source: <strong className="text-[#FAFAFA]">{item.sourceName}</strong>
                      </span>
                    </div>

                    <h4 className="mt-1 text-sm font-bold text-[#FAFAFA]">
                      {item.title}
                    </h4>

                    <p className="mt-1 text-xs text-[#A0A4A8]">
                      Read on {new Date(item.readAt).toLocaleString()} • Time spent:{" "}
                      <strong className="text-[#FAFAFA]">{minSpent} mins</strong> •{" "}
                      {item.completedReading ? (
                        <span className="text-[#0D9040]">✓ Completed</span>
                      ) : (
                        <span className="text-[#6C5CE7]">Partial Read</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end space-x-4 border-t border-[#2E2E32] pt-3 sm:mt-0 sm:border-t-0 sm:pt-0">
                  <div className="text-right">
                    <span className="block text-[10px] uppercase tracking-wider text-[#A0A4A8]">
                      Engagement Score
                    </span>
                    <span className="font-mono text-xs font-bold text-[#3399FF]">
                      {engagePct}%
                    </span>
                  </div>
                  <div className="h-8 w-1.5 rounded-full bg-[#2E2E32]">
                    <div
                      className="rounded-full bg-[#0066CC]"
                      style={{ height: `${engagePct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
