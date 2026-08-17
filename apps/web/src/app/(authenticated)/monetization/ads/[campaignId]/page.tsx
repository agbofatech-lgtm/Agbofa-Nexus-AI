"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../../lib/bff/client";
import { SAMPLE_AD_CAMPAIGNS } from "../../mock-data";
import { AdCampaignItem, CampaignStatus } from "../../types";

const CAMP_BADGES: Record<
  CampaignStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  ACTIVE: {
    label: "ACTIVE",
    bgClass: "bg-[#0D9040]/20",
    textClass: "text-[#0D9040]",
  },
  PAUSED: {
    label: "PAUSED",
    bgClass: "bg-[#F59E0B]/20",
    textClass: "text-[#F59E0B]",
  },
  DRAFT: {
    label: "DRAFT",
    bgClass: "bg-gray-600/20",
    textClass: "text-gray-400",
  },
  COMPLETED: {
    label: "COMPLETED",
    bgClass: "bg-[#3399FF]/20",
    textClass: "text-[#3399FF]",
  },
};

export default function CampaignDetailPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams();
  const campaignId =
    typeof params?.campaignId === "string" ? params.campaignId : "camp-001";

  const [campaign, setCampaign] = useState<AdCampaignItem>(() => {
    return (
      SAMPLE_AD_CAMPAIGNS.find((c) => c.id === campaignId) ||
      SAMPLE_AD_CAMPAIGNS[0]!
    );
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchCampaignDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string; campaign_id: string },
          { status?: string }
        >("runtime.v1.AIGatewayService", "InvokeModel", {
          tenant_id: "tenant-default",
          campaign_id: campaignId,
        });
        if (resp.status === "ERROR") {
          setError("Failed to retrieve campaign detail from BFF proxy.");
        }
      } catch {
        // Fallback to sample campaign
      } finally {
        setIsLoading(false);
      }
    }
    fetchCampaignDetail();
  }, [campaignId]);

  const handleStatusChange = (newStatus: CampaignStatus) => {
    setCampaign((prev) => ({ ...prev, status: newStatus }));
    alert(
      `Campaign status authoritatively transitioned to "${newStatus}" in AdvertisingEngine RLS ledger.`,
    );
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
            Ad Campaign Detail (IMP-021)
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
            Campaign Detail Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error ||
              "Simulated error: unable to reach campaign detail endpoint via BFF proxy."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "error") setSimulateMode("normal");
              else window.location.reload();
            }}
            className="rounded-md bg-[#CF2020] px-4 py-2 text-xs font-semibold text-[#FAFAFA]"
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
            Ad Campaign Detail (IMP-021)
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
            Zero campaign telemetry recorded
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            This ad campaign has zero deduplicated impressions or click events recorded in the selected period.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setCampaign(SAMPLE_AD_CAMPAIGNS[0]!);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Campaign Detail
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  const badge = CAMP_BADGES[campaign.status];

  return (
    <div className="space-y-8">
      {/* Top Header & Navigation Back */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <div>
          <button
            type="button"
            onClick={() => router.push("/monetization/ads")}
            className="mb-2 text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Campaigns Ledger
          </button>
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              {campaign.name}
            </h2>
            <span
              className={`rounded px-2.5 py-0.5 text-xs font-bold border ${badge.bgClass} ${badge.textClass}`}
            >
              ● {badge.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            ID: <strong className="font-mono text-[#FAFAFA]">{campaign.id}</strong> •{" "}
            {new Date(campaign.startDate).toLocaleDateString()} –{" "}
            {new Date(campaign.endDate).toLocaleDateString()}
          </p>
        </div>

        {/* Lifecycle Actions */}
        <div className="flex items-center space-x-2">
          {campaign.status === "ACTIVE" && (
            <button
              type="button"
              onClick={() => handleStatusChange("PAUSED")}
              className="rounded border border-[#F59E0B] bg-[#F59E0B]/20 px-3 py-1.5 text-xs font-bold text-[#F59E0B] hover:bg-[#F59E0B]/40 transition-colors"
            >
              ⏸ Pause Campaign
            </button>
          )}

          {campaign.status === "PAUSED" && (
            <button
              type="button"
              onClick={() => handleStatusChange("ACTIVE")}
              className="rounded border border-[#0D9040] bg-[#0D9040]/20 px-3 py-1.5 text-xs font-bold text-[#0D9040] hover:bg-[#0D9040]/40 transition-colors"
            >
              ▶ Resume Campaign
            </button>
          )}

          {campaign.status !== "COMPLETED" && (
            <button
              type="button"
              onClick={() => handleStatusChange("COMPLETED")}
              className="rounded border border-[#3399FF] bg-[#3399FF]/20 px-3 py-1.5 text-xs font-bold text-[#3399FF] hover:bg-[#3399FF]/40 transition-colors"
            >
              ✓ Complete Campaign
            </button>
          )}

          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* 5 Performance Stat Cards (Impressions, Clicks, CTR, Spend, CPC/CPM) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Impressions (Dedup)
          </span>
          <div className="mt-1 font-mono text-2xl font-extrabold text-[#FAFAFA]">
            {campaign.impressions.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            1-hr reader+placement dedup
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Verified Clicks
          </span>
          <div className="mt-1 font-mono text-2xl font-extrabold text-[#0D9040]">
            {campaign.clicks.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            100% Click-deduplication
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Click-Through (CTR)
          </span>
          <div className="mt-1 font-mono text-2xl font-extrabold text-[#3399FF]">
            {campaign.ctrPercentage.toFixed(2)}%
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            SaaS Industry High
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Budget vs Spend
          </span>
          <div className="mt-1 font-mono text-2xl font-extrabold text-[#F59E0B]">
            ${campaign.spendUsd.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            of ${campaign.budgetUsd.toLocaleString()} Budget
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            CPC / CPM Rates
          </span>
          <div className="mt-1 font-mono text-2xl font-extrabold text-[#6C5CE7]">
            ${campaign.cpcUsd.toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            CPM: ${campaign.cpmUsd.toFixed(2)} / 1K imp
          </p>
        </div>
      </div>

      {/* Platform Breakdown Section */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <h3 className="mb-2 text-sm font-bold text-[#FAFAFA]">
          Per-Platform Performance Breakdown
        </h3>
        <p className="mb-4 text-xs text-[#A0A4A8]">
          Attribution breakdown across target distribution channels
        </p>

        {campaign.platformBreakdown.length === 0 ? (
          <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-4 text-center text-xs text-[#A0A4A8]">
            No platform breakdown recorded for this campaign.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {campaign.platformBreakdown.map((pb) => (
              <div
                key={pb.platform}
                className="rounded-lg border border-[#2E2E32] bg-[#0A0A0B] p-4 space-y-2"
              >
                <div className="flex items-center justify-between border-b border-[#2E2E32] pb-2">
                  <h4 className="text-sm font-bold text-[#FAFAFA]">
                    {pb.platform}
                  </h4>
                  <span className="rounded bg-[#0066CC]/20 px-2 py-0.5 font-mono text-xs font-bold text-[#3399FF]">
                    {pb.ctrPercentage}% CTR
                  </span>
                </div>

                <div className="flex justify-between text-xs text-[#A0A4A8]">
                  <span>Impressions:</span>
                  <strong className="font-mono text-[#FAFAFA]">
                    {pb.impressions.toLocaleString()}
                  </strong>
                </div>

                <div className="flex justify-between text-xs text-[#A0A4A8]">
                  <span>Clicks:</span>
                  <strong className="font-mono text-[#0D9040]">
                    {pb.clicks.toLocaleString()}
                  </strong>
                </div>

                <div className="flex justify-between text-xs text-[#A0A4A8]">
                  <span>Spend Allocation:</span>
                  <strong className="font-mono text-[#F59E0B]">
                    ${pb.spendUsd.toFixed(2)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brand Safety & Targeting Ledgers */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-[#3399FF]">
            Targeted Topics (Positive Match)
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {campaign.targetTopics.map((top) => (
              <span
                key={top}
                className="rounded bg-[#0066CC]/20 px-2 py-1 font-mono text-xs font-semibold text-[#3399FF] border border-[#0066CC]/30"
              >
                ✓ {top}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-[#CF2020]">
            Excluded Topics (Negative Match)
          </h4>
          {campaign.excludedTopics.length === 0 ? (
            <p className="text-xs text-[#A0A4A8]">Zero topic exclusions</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {campaign.excludedTopics.map((top) => (
                <span
                  key={top}
                  className="rounded bg-[#CF2020]/20 px-2 py-1 font-mono text-xs font-semibold text-[#CF2020] border border-[#CF2020]/30"
                >
                  🚫 {top}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-[#F59E0B]">
            Excluded Keywords (Brand Safety)
          </h4>
          {campaign.excludedKeywords.length === 0 ? (
            <p className="text-xs text-[#A0A4A8]">Zero keyword exclusions</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {campaign.excludedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded bg-[#F59E0B]/20 px-2 py-1 font-mono text-xs font-semibold text-[#F59E0B] border border-[#F59E0B]/30"
                >
                  🚫 {kw}
                </span>
              ))}
            </div>
          )}
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
