"use client";

import React, { useState } from "react";
import { CampaignFormData } from "../types";

export interface CampaignFormProps {
  initialData?: Partial<CampaignFormData>;
  onSubmitCampaign: (data: CampaignFormData) => void;
  onCancel: () => void;
}

const ALL_PLATFORMS = [
  "Twitter/X",
  "Facebook",
  "LinkedIn",
  "Instagram",
  "YouTube",
];

const ALL_TOPICS = [
  "BREAKING",
  "TECHNOLOGY",
  "BUSINESS",
  "SCIENCE",
  "HEALTH",
  "POLITICS",
  "SPORTS",
  "ENTERTAINMENT",
];

export function CampaignForm({
  initialData,
  onSubmitCampaign,
  onCancel,
}: CampaignFormProps): React.JSX.Element {
  const [name, setName] = useState<string>(
    initialData?.name || "New Autonomous Ad Campaign",
  );
  const [budgetUsd, setBudgetUsd] = useState<number>(
    initialData?.budgetUsd || 2500,
  );
  const [startDate, setStartDate] = useState<string>(
    initialData?.startDate || new Date().toISOString().split("T")[0]!,
  );
  const [endDate, setEndDate] = useState<string>(
    initialData?.endDate ||
      new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]!,
  );
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>(
    initialData?.targetPlatforms || ["Twitter/X", "LinkedIn"],
  );
  const [targetTopics, setTargetTopics] = useState<string[]>(
    initialData?.targetTopics || ["TECHNOLOGY", "BUSINESS"],
  );
  const [excludedTopics, setExcludedTopics] = useState<string[]>(
    initialData?.excludedTopics || ["ENTERTAINMENT"],
  );
  const [keywordsStr, setKeywordsStr] = useState<string>(
    initialData?.excludedKeywords?.join(", ") ||
      "controversy, unverified, gossip",
  );

  const togglePlatform = (plat: string) => {
    setTargetPlatforms((prev) =>
      prev.includes(plat) ? prev.filter((p) => p !== plat) : [...prev, plat],
    );
  };

  const toggleTopic = (topic: string) => {
    setTargetTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const toggleExcludedTopic = (topic: string) => {
    setExcludedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please specify a campaign name.");
      return;
    }
    const excludedKeywords = keywordsStr
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    onSubmitCampaign({
      name,
      budgetUsd,
      startDate,
      endDate,
      targetPlatforms,
      targetTopics,
      excludedTopics,
      excludedKeywords,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border border-[#0066CC]/50 bg-[#12121A] p-6 shadow-xl"
    >
      <div className="border-b border-[#2E2E32] pb-3">
        <h3 className="text-lg font-bold text-[#FAFAFA]">
          Create / Edit Advertising Campaign (IMP-021 AdvertisingEngine)
        </h3>
        <p className="text-xs text-[#A0A4A8]">
          Configure placement matching, brand safety exclusions, and budget accounting in PostgreSQL RLS (<code className="font-mono text-[#FAFAFA]">ad_campaigns</code>)
        </p>
      </div>

      {/* Name & Budget */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-[#FAFAFA]">
            Campaign Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] focus:border-[#0066CC] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#FAFAFA]">
            Campaign Budget (USD $)
          </label>
          <input
            type="number"
            min="100"
            step="50"
            value={budgetUsd}
            onChange={(e) => setBudgetUsd(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 font-mono text-xs text-[#FAFAFA] focus:border-[#0066CC] focus:outline-none"
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-[#FAFAFA]">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] focus:border-[#0066CC] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#FAFAFA]">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] focus:border-[#0066CC] focus:outline-none"
          />
        </div>
      </div>

      {/* Target Platforms Multi-Select */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[#FAFAFA]">
          Target Distribution Platforms
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_PLATFORMS.map((plat) => {
            const active = targetPlatforms.includes(plat);
            return (
              <button
                key={plat}
                type="button"
                onClick={() => togglePlatform(plat)}
                className={`rounded border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-[#0066CC] bg-[#0066CC] text-white"
                    : "border-[#2E2E32] bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
                }`}
              >
                {active ? "✓ " : "+ "}
                {plat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Topics Multi-Select */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[#FAFAFA]">
          Target Topics (Positive Matching)
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_TOPICS.map((topic) => {
            const active = targetTopics.includes(topic);
            return (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                className={`rounded border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-[#0D9040] bg-[#0D9040] text-white"
                    : "border-[#2E2E32] bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
                }`}
              >
                {active ? "✓ " : "+ "}
                {topic}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand Safety: Excluded Topics */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[#CF2020]">
          Brand Safety Excluded Topics (Negative Matching)
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_TOPICS.map((topic) => {
            const excluded = excludedTopics.includes(topic);
            return (
              <button
                key={`ex-${topic}`}
                type="button"
                onClick={() => toggleExcludedTopic(topic)}
                className={`rounded border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  excluded
                    ? "border-[#CF2020] bg-[#CF2020] text-white"
                    : "border-[#2E2E32] bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
                }`}
              >
                {excluded ? "🚫 Excluded: " : "+ Exclude: "}
                {topic}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand Safety: Excluded Keywords */}
      <div>
        <label className="block text-xs font-semibold text-[#CF2020]">
          Brand Safety Excluded Keywords (Comma-separated)
        </label>
        <input
          type="text"
          value={keywordsStr}
          onChange={(e) => setKeywordsStr(e.target.value)}
          placeholder="controversy, unverified, gossip"
          className="mt-1 w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#FAFAFA] focus:border-[#CF2020] focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-[#A0A4A8]">
          Any article matching these keywords in title or summary will never display this ad campaign.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 border-t border-[#2E2E32] pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-4 py-2 text-xs font-semibold text-[#A0A4A8] hover:text-[#FAFAFA]"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded bg-[#0066CC] px-5 py-2 text-xs font-bold text-white hover:bg-[#3399FF]"
        >
          Save & Activate Ad Campaign
        </button>
      </div>
    </form>
  );
}
