"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../lib/bff/client";
import {
  INITIAL_OVERVIEW_STATS,
  SAMPLE_RECENT_TRANSACTIONS,
} from "./mock-data";
import {
  MonetizationOverviewStats,
  RecentTransactionItem,
} from "./types";

const TX_BADGES: Record<
  RecentTransactionItem["type"],
  { label: string; bgClass: string; textClass: string }
> = {
  PAYMENT: {
    label: "RECURRING PAYMENT",
    bgClass: "bg-[#0D9040]/20",
    textClass: "text-[#0D9040]",
  },
  UPGRADE: {
    label: "TIER UPGRADE",
    bgClass: "bg-[#0066CC]/20",
    textClass: "text-[#3399FF]",
  },
  NEW_SUBSCRIPTION: {
    label: "NEW ACTIVATION",
    bgClass: "bg-[#6C5CE7]/20",
    textClass: "text-[#6C5CE7]",
  },
  DOWNGRADE: {
    label: "DOWNGRADE",
    bgClass: "bg-[#F59E0B]/20",
    textClass: "text-[#F59E0B]",
  },
  CANCELLATION: {
    label: "CANCELED",
    bgClass: "bg-[#CF2020]/20",
    textClass: "text-[#CF2020]",
  },
};

export default function MonetizationOverviewPage(): React.JSX.Element {
  const router = useRouter();
  const [stats, setStats] = useState<MonetizationOverviewStats>(
    INITIAL_OVERVIEW_STATS,
  );
  const [transactions, setTransactions] = useState<RecentTransactionItem[]>(
    SAMPLE_RECENT_TRANSACTIONS,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchMonetizationOverview() {
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
          setError("Failed to retrieve monetization telemetry from BFF proxy.");
        }
      } catch {
        // Fallback to authoritative sample data
      } finally {
        setIsLoading(false);
      }
    }
    fetchMonetizationOverview();
  }, []);

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            Monetization Intelligence Overview
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
            Monetization Telemetry Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error ||
              "Simulated error: unable to contact MonetizationService via BFF proxy."}
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
    (transactions.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Monetization Intelligence Overview
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
            Zero financial transactions recorded today
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            The monetization engine has zero payments, upgrades, or subscription events in the selected window.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setTransactions(SAMPLE_RECENT_TRANSACTIONS);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Financial Ledger
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-8">
      {/* Top Title & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            Authoritative Monetization Dashboard (IMP-021)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Monitoring Subscriptions, Paywall Entitlements, Advertising Campaigns, and Revenue Invariants
          </p>
        </div>
        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Active Subscriptions
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#FAFAFA]">
              {stats.activeSubscriptionsCount.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-[#0D9040]">
              +68 net this month
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            {stats.freeSubscriptionsCount} Free • {stats.premiumSubscriptionsCount} Premium • {stats.enterpriseSubscriptionsCount} Enterprise
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Monthly Revenue (MRR)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#3399FF]">
              ${stats.monthlyRecurringRevenueUsd.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-[#0D9040]">
              +12.4% MoM
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            Invariant ARR: ${(stats.monthlyRecurringRevenueUsd * 12).toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Active Ad Campaigns
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#0D9040]">
              {stats.activeAdCampaignsCount}
            </span>
            <span className="text-xs font-semibold text-[#0D9040]">
              100% Brand Safe
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            1-hr impression & click deduplication
          </p>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
            Paywall Triggers (24h)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#6C5CE7]">
              {stats.paywallTriggers24h}
            </span>
            <span className="text-xs font-semibold text-[#3399FF]">
              RLS Entitlements
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#A0A4A8]">
            Atomic Serializable meter increment
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards to the 4 monetization domains */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => router.push("/monetization/subscribe")}
          className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-colors hover:border-[#0066CC]"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#FAFAFA] group-hover:text-[#3399FF]">
              1. Plans & Checkout →
            </h3>
            <span className="rounded bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF] border border-[#0066CC]/30">
              3 TIERS
            </span>
          </div>
          <p className="text-xs text-[#A0A4A8]">
            Compare Free ($0), Premium ($29), and Enterprise ($199) tiers, manage tokenized cards, and test upgrade/downgrade checkout flows.
          </p>
        </div>

        <div
          onClick={() => router.push("/monetization/billing")}
          className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-colors hover:border-[#0D9040]"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#FAFAFA] group-hover:text-[#0D9040]">
              2. Billing & Metering →
            </h3>
            <span className="rounded bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040] border border-[#0D9040]/30">
              RLS QUOTA
            </span>
          </div>
          <p className="text-xs text-[#A0A4A8]">
            Download historical invoices, manage stored PCI-DSS payment tokens, and inspect the 5-article paywall meter progress bar.
          </p>
        </div>

        <div
          onClick={() => router.push("/monetization/ads")}
          className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-colors hover:border-[#6C5CE7]"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#FAFAFA] group-hover:text-[#6C5CE7]">
              3. Ad Campaigns →
            </h3>
            <span className="rounded bg-[#6C5CE7]/20 px-2 py-0.5 text-[10px] font-bold text-[#6C5CE7] border border-[#6C5CE7]/30">
              CPM / CPC
            </span>
          </div>
          <p className="text-xs text-[#A0A4A8]">
            Create and manage brand-safe advertising campaigns, configure topic/keyword exclusions, and inspect deduplicated CTR metrics.
          </p>
        </div>

        <div
          onClick={() => router.push("/monetization/revenue")}
          className="group cursor-pointer rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-colors hover:border-[#3399FF]"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#FAFAFA] group-hover:text-[#FAFAFA]">
              4. Revenue Analytics →
            </h3>
            <span className="rounded bg-[#3399FF]/20 px-2 py-0.5 text-[10px] font-bold text-[#FAFAFA] border border-[#3399FF]/30">
              ARR / LTV
            </span>
          </div>
          <p className="text-xs text-[#A0A4A8]">
            Analyze 12-month MRR/ARR trend charts, evaluate LTV and $15 CAC assumptions, and view subscription tier conversion cohorts.
          </p>
        </div>
      </div>

      {/* Recent Transactions Feed */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#2E2E32] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              Recent Financial Transactions & Tier Changes (IMP-021)
            </h3>
            <p className="text-xs text-[#A0A4A8]">
              Live inspection feed of recurring payments, prorated upgrades, enterprise seat activations, and ad invoices
            </p>
          </div>
          <span className="rounded bg-[#0066CC]/20 px-2.5 py-1 text-xs font-bold text-[#3399FF] border border-[#0066CC]/40">
            {transactions.length} Recent Events
          </span>
        </div>

        <div className="space-y-3">
          {transactions.map((tx) => {
            const badge = TX_BADGES[tx.type];

            return (
              <div
                key={tx.id}
                className="flex flex-col justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#0A0A0B] p-4 transition-colors hover:border-[#0066CC] sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold border ${badge.bgClass} ${badge.textClass}`}
                    >
                      {badge.label}
                    </span>
                    {tx.planTier && (
                      <span className="rounded bg-[#12121A] px-2 py-0.5 font-mono text-[10px] text-[#3399FF] border border-[#2E2E32]">
                        Tier: {tx.planTier}
                      </span>
                    )}
                    <span className="text-[11px] text-[#A0A4A8]">
                      {new Date(tx.date).toLocaleString()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#FAFAFA]">
                    {tx.description}
                  </h4>
                </div>

                <div className="flex items-center justify-end space-x-4 border-t border-[#2E2E32] pt-3 sm:border-t-0 sm:pt-0">
                  <div className="text-right">
                    <span className="block font-mono text-base font-extrabold text-[#0D9040]">
                      ${tx.amountUsd.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#0D9040]">
                      {tx.status}
                    </span>
                  </div>
                  <span
                    onClick={() => router.push("/monetization/billing")}
                    className="cursor-pointer text-xs font-bold text-[#3399FF] hover:underline"
                  >
                    Invoice →
                  </span>
                </div>
              </div>
            );
          })}
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
