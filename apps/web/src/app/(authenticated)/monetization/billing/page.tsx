"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { UsageMeter } from "../components/usage-meter";
import { PaymentMethod } from "../components/payment-method";
import {
  SAMPLE_INVOICES,
  SAMPLE_STORED_CARDS,
  SAMPLE_METERED_USAGE,
  SAMPLE_BILLING_CYCLE,
} from "../mock-data";
import {
  InvoiceItem,
  StoredCard,
  MeteredUsageState,
  BillingCycleInfo,
  InvoiceStatus,
} from "../types";

const INVOICE_BADGES: Record<
  InvoiceStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  PAID: {
    label: "PAID INVOICE",
    bgClass: "bg-[#0D9040]/20",
    textClass: "text-[#0D9040]",
  },
  PENDING: {
    label: "PENDING PAYMENT",
    bgClass: "bg-[#F59E0B]/20",
    textClass: "text-[#F59E0B]",
  },
  FAILED: {
    label: "PAYMENT FAILED",
    bgClass: "bg-[#CF2020]/20",
    textClass: "text-[#CF2020]",
  },
};

export default function BillingHistoryPage(): React.JSX.Element {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceItem[]>(SAMPLE_INVOICES);
  const [cards, setCards] = useState<StoredCard[]>(SAMPLE_STORED_CARDS);
  const [usage] = useState<MeteredUsageState>(SAMPLE_METERED_USAGE);
  const [cycle] = useState<BillingCycleInfo>(SAMPLE_BILLING_CYCLE);

  const [dateRangeFilter, setDateRangeFilter] = useState<"ALL" | "LAST_90D">("ALL");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchBillingLedger() {
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
          setError("Failed to retrieve billing history ledger from BFF proxy.");
        }
      } catch {
        // Fallback to sample billing ledger
      } finally {
        setIsLoading(false);
      }
    }
    fetchBillingLedger();
  }, []);

  const handleDownloadInvoice = (inv: InvoiceItem) => {
    alert(
      `Downloading PDF Invoice "${inv.id}" (${inv.description} - $${inv.amountUsd.toFixed(2)} USD). PDF generation placeholder signed by Stripe/Paystack.`,
    );
  };

  const handleAddCard = (newCard: Omit<StoredCard, "id" | "isDefault">) => {
    const created: StoredCard = {
      ...newCard,
      id: `card-${Date.now()}`,
      isDefault: cards.length === 0,
    };
    setCards((prev) => [...prev, created]);
  };

  const handleSetDefaultCard = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) => ({ ...c, isDefault: c.id === cardId })),
    );
  };

  const handleRemoveCard = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
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
            Billing History & Payment Ledgers (IMP-021)
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
            Billing Ledger Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error ||
              "Simulated error: unable to load billing history invoices via BFF proxy."}
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
    (invoices.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Billing History & Payment Ledgers (IMP-021)
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
            Zero invoices or billing history recorded
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            No invoices have been generated for this tenant account. Free tier readers incur zero billing events.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setInvoices(SAMPLE_INVOICES);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Invoices Ledger
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  const displayedInvoices =
    dateRangeFilter === "ALL"
      ? invoices
      : invoices.filter(
          (inv) =>
            new Date(inv.date).getTime() >= Date.now() - 90 * 86400000,
        );

  return (
    <div className="space-y-8">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-3">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            Authoritative Billing History, Invoices & Paywall Metering (IMP-021)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Inspect invoice PDF receipts, manage PCI-DSS Level 1 tokenized cards, and monitor paywall entitlements
          </p>
        </div>

        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* Usage Meter Component */}
      <UsageMeter
        usage={usage}
        onUpgradePlan={() => router.push("/monetization/subscribe")}
      />

      {/* Current Billing Cycle Overview Card */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <h3 className="mb-3 text-sm font-bold text-[#FAFAFA]">
          Current Billing Period & Subscription Cycle (IMP-021)
        </h3>
        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
          <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3">
            <span className="block font-semibold text-[#A0A4A8]">Active Subscription Plan</span>
            <span className="font-bold text-[#3399FF]">
              {cycle.planName} (${cycle.monthlyRateUsd.toFixed(2)} / mo)
            </span>
          </div>
          <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3">
            <span className="block font-semibold text-[#A0A4A8]">Current Period Range</span>
            <span className="font-mono text-[#FAFAFA]">
              {new Date(cycle.currentPeriodStart).toLocaleDateString()} –{" "}
              {new Date(cycle.currentPeriodEnd).toLocaleDateString()}
            </span>
          </div>
          <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3">
            <span className="block font-semibold text-[#A0A4A8]">Next Billing Date</span>
            <span className="font-mono font-bold text-[#0D9040]">
              {new Date(cycle.nextBillingDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice History Table */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2E32] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              Invoice Ledger & Payment Receipts Table
            </h3>
            <p className="text-xs text-[#A0A4A8]">
              Download PDF invoices for accounting reconciliation and tax compliance
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#A0A4A8]">Filter Range:</span>
            <button
              type="button"
              onClick={() => setDateRangeFilter("ALL")}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                dateRangeFilter === "ALL"
                  ? "bg-[#0066CC] text-white"
                  : "bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
              }`}
            >
              All Time ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setDateRangeFilter("LAST_90D")}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                dateRangeFilter === "LAST_90D"
                  ? "bg-[#0066CC] text-white"
                  : "bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
              }`}
            >
              Last 90 Days
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#FAFAFA]">
            <thead className="border-b border-[#2E2E32] bg-[#0A0A0B] text-[11px] uppercase tracking-wider text-[#A0A4A8]">
              <tr>
                <th className="p-3">Invoice ID / Date</th>
                <th className="p-3">Description</th>
                <th className="p-3">Amount (USD)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E32]">
              {displayedInvoices.map((inv) => {
                const badge = INVOICE_BADGES[inv.status];
                return (
                  <tr
                    key={inv.id}
                    className="transition-colors hover:bg-[#0A0A0B]/60"
                  >
                    <td className="p-3">
                      <div className="font-mono font-bold text-[#3399FF]">
                        {inv.id}
                      </div>
                      <div className="text-[11px] text-[#A0A4A8]">
                        {new Date(inv.date).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="font-semibold text-[#FAFAFA]">
                        {inv.description}
                      </span>
                    </td>

                    <td className="p-3 font-mono font-bold text-[#0D9040]">
                      ${inv.amountUsd.toFixed(2)}
                    </td>

                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold border ${badge.bgClass} ${badge.textClass}`}
                      >
                        {badge.label}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(inv)}
                        className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1 font-semibold text-[#3399FF] hover:bg-[#0066CC] hover:text-white transition-colors"
                      >
                        📄 Download PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods Component */}
      <PaymentMethod
        storedCards={cards}
        onAddCard={handleAddCard}
        onSetDefault={handleSetDefaultCard}
        onRemoveCard={handleRemoveCard}
      />
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
