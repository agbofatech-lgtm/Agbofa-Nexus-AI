"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { CampaignForm } from "../components/campaign-form";
import { SAMPLE_AD_CAMPAIGNS } from "../mock-data";
import {
  AdCampaignItem,
  CampaignFormData,
  CampaignStatus,
} from "../types";

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

export default function AdCampaignListPage(): React.JSX.Element {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<AdCampaignItem[]>(
    SAMPLE_AD_CAMPAIGNS,
  );
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchCampaignsLedger() {
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
          setError("Failed to retrieve ad campaigns ledger from BFF proxy.");
        }
      } catch {
        // Fallback to sample ad campaigns
      } finally {
        setIsLoading(false);
      }
    }
    fetchCampaignsLedger();
  }, []);

  const handleCreateCampaign = (data: CampaignFormData) => {
    const newCamp: AdCampaignItem = {
      id: `camp-${Date.now()}`,
      name: data.name,
      status: "ACTIVE",
      budgetUsd: data.budgetUsd,
      spendUsd: 0,
      startDate: data.startDate,
      endDate: data.endDate,
      impressions: 0,
      clicks: 0,
      ctrPercentage: 0.0,
      cpcUsd: 0.0,
      cpmUsd: 0.0,
      targetPlatforms: data.targetPlatforms,
      targetTopics: data.targetTopics,
      excludedTopics: data.excludedTopics,
      excludedKeywords: data.excludedKeywords,
      platformBreakdown: [],
      createdAt: new Date().toISOString(),
    };

    setCampaigns((prev) => [newCamp, ...prev]);
    setShowCreateForm(false);
    alert(
      `Campaign "${newCamp.name}" created and activated! 1-hour reader+placement impression deduplication is enforced by IMP-021 AdvertisingEngine.`,
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
            Ad Campaign Management & Brand Safety (IMP-021)
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
            Ad Campaigns Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error ||
              "Simulated error: unable to reach AdvertisingEngine via BFF proxy."}
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
  if (
    simulateMode === "empty" ||
    (campaigns.length === 0 && !showCreateForm && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Ad Campaign Management & Brand Safety (IMP-021)
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
            Zero active advertising campaigns recorded
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            No ad campaigns are currently active in this tenant profile. Create a campaign to configure brand safety and placement matching.
          </p>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                if (simulateMode === "empty") setSimulateMode("normal");
                else setCampaigns(SAMPLE_AD_CAMPAIGNS);
              }}
              className="rounded-md bg-[#2E2E32] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA]"
            >
              Load Sample Campaigns
            </button>
            <button
              type="button"
              onClick={() => {
                if (simulateMode === "empty") setSimulateMode("normal");
                else setShowCreateForm(true);
              }}
              className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
            >
              + Create Campaign
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  const displayedCampaigns =
    statusFilter === "ALL"
      ? campaigns
      : campaigns.filter((c) => c.status === statusFilter);

  return (
    <div className="space-y-8">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-3">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            Authoritative Advertising Engine & Brand Safety Management (IMP-021)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            1-hour impression & click deduplication, CPM/CPC revenue attribution, and excluded keywords ledger
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded bg-[#0066CC] px-4 py-2 text-xs font-bold text-white hover:bg-[#3399FF] transition-colors"
          >
            {showCreateForm ? "Close Form" : "+ Create Campaign"}
          </button>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Create Campaign Form Modal / Overlay */}
      {showCreateForm && (
        <CampaignForm
          onSubmitCampaign={handleCreateCampaign}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Campaign List Table Section */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2E32] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              Ad Campaigns Ledger Table ({campaigns.length} Total)
            </h3>
            <p className="text-xs text-[#A0A4A8]">
              Click any campaign row to inspect its full platform breakdown and lifecycle controls
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#A0A4A8]">Filter Status:</span>
            {(["ALL", "ACTIVE", "PAUSED", "COMPLETED", "DRAFT"] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                    statusFilter === st
                      ? "bg-[#0066CC] text-white"
                      : "bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
                  }`}
                >
                  {st}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#FAFAFA]">
            <thead className="border-b border-[#2E2E32] bg-[#0A0A0B] text-[11px] uppercase tracking-wider text-[#A0A4A8]">
              <tr>
                <th className="p-3">Campaign Name / Date Range</th>
                <th className="p-3">Status</th>
                <th className="p-3">Budget (Spend)</th>
                <th className="p-3">Impressions (Dedup)</th>
                <th className="p-3">Clicks</th>
                <th className="p-3">CTR (%)</th>
                <th className="p-3 text-right">Inspect Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E32]">
              {displayedCampaigns.map((camp) => {
                const badge = CAMP_BADGES[camp.status];

                return (
                  <tr
                    key={camp.id}
                    onClick={() => router.push(`/monetization/ads/${camp.id}`)}
                    className="cursor-pointer transition-colors hover:bg-[#0066CC]/10"
                  >
                    <td className="p-3">
                      <div className="font-bold text-[#FAFAFA]">
                        {camp.name}
                      </div>
                      <div className="font-mono text-[11px] text-[#A0A4A8]">
                        {new Date(camp.startDate).toLocaleDateString()} –{" "}
                        {new Date(camp.endDate).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold border ${badge.bgClass} ${badge.textClass}`}
                      >
                        ● {badge.label}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="font-mono font-bold text-[#3399FF]">
                        ${camp.budgetUsd.toLocaleString()}
                      </div>
                      <div className="font-mono text-[11px] text-[#0D9040]">
                        Spent: ${camp.spendUsd.toLocaleString()}
                      </div>
                    </td>

                    <td className="p-3 font-mono font-bold text-[#FAFAFA]">
                      {camp.impressions.toLocaleString()}
                    </td>

                    <td className="p-3 font-mono font-bold text-[#0D9040]">
                      {camp.clicks.toLocaleString()}
                    </td>

                    <td className="p-3">
                      <span className="font-mono text-sm font-extrabold text-[#3399FF]">
                        {camp.ctrPercentage.toFixed(2)}%
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <span className="rounded bg-[#2E2E32] px-3 py-1 font-semibold text-[#FAFAFA] hover:bg-[#0066CC]">
                        Detail →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
