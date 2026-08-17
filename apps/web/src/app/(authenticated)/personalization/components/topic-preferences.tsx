"use client";

import React from "react";
import { TopicPreferenceItem } from "../types";

export interface TopicPreferencesProps {
  topics: TopicPreferenceItem[];
  onToggleFollow: (topicId: string) => void;
  onChangeInterestScore: (topicId: string, newScore: number) => void;
}

export function TopicPreferences({
  topics,
  onToggleFollow,
  onChangeInterestScore,
}: TopicPreferencesProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#2E2E32] pb-3">
        <div>
          <h3 className="text-base font-bold text-[#FAFAFA]">
            Topic Preferences & Interest Weighting (PERS-001)
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            Configure explicit topic following and fine-tune your semantic interest scores (0–100%)
          </p>
        </div>
        <span className="rounded-full bg-[#0066CC]/10 px-3 py-1 text-xs font-semibold text-[#3399FF] border border-[#0066CC]/30">
          {topics.filter((t) => t.isFollowed).length} Topics Active
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topics.map((item) => {
          const interestPct = Math.round(item.interestScore * 100);
          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-lg border p-4 transition-colors ${
                item.isFollowed
                  ? "border-[#0066CC]/50 bg-[#12121A] shadow-sm"
                  : "border-[#2E2E32] bg-[#0A0A0B]/60 opacity-80"
              }`}
            >
              <div>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#FAFAFA]">
                      {item.categoryName}
                    </h4>
                    <span className="text-[11px] font-mono uppercase text-[#3399FF]">
                      {item.topic}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleFollow(item.id)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                      item.isFollowed
                        ? "bg-[#0066CC] text-white hover:bg-[#3399FF]"
                        : "border border-[#2E2E32] bg-[#12121A] text-[#A0A4A8] hover:text-[#FAFAFA]"
                    }`}
                    aria-label={`Toggle follow for ${item.categoryName}`}
                  >
                    {item.isFollowed ? "Followed" : "Unfollowed"}
                  </button>
                </div>

                <div className="mb-3 flex items-center justify-between text-xs text-[#A0A4A8]">
                  <span>{item.readCount} stories read</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      item.isExplicit
                        ? "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/30"
                        : "bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/30"
                    }`}
                  >
                    {item.isExplicit ? "Explicit Follow" : "Implicitly Inferred"}
                  </span>
                </div>
              </div>

              {/* Interest Slider Control */}
              <div className="mt-3 border-t border-[#2E2E32] pt-3">
                <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#A0A4A8]">Interest Level</span>
                  <span className="font-mono text-[#FAFAFA]">{interestPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={interestPct}
                  disabled={!item.isFollowed}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onChangeInterestScore(item.id, val / 100);
                  }}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#2E2E32] accent-[#0066CC] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Interest slider for ${item.categoryName}`}
                />
                <div className="mt-1 flex justify-between text-[10px] text-[#A0A4A8]">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High (1.00)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
