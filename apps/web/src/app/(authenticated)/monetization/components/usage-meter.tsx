"use client";

import React from "react";
import { MeteredUsageState } from "../types";

export interface UsageMeterProps {
  usage: MeteredUsageState;
  onUpgradePlan?: () => void;
}

export function UsageMeter({
  usage,
  onUpgradePlan,
}: UsageMeterProps): React.JSX.Element {
  const isUnlimited = usage.articlesLimit === "UNLIMITED";
  const limitNum = isUnlimited ? 1 : (usage.articlesLimit as number);
  const usedNum = usage.articlesUsed;

  const pct = isUnlimited ? 0 : Math.min(100, Math.round((usedNum / limitNum) * 100));

  let barColor = "bg-[#0D9040]"; // green < 80%
  let statusTextClass = "text-[#0D9040]";
  let statusLabel = "HEALTHY QUOTA";

  if (!isUnlimited) {
    if (pct >= 100) {
      barColor = "bg-[#CF2020]"; // red limit reached
      statusTextClass = "text-[#CF2020]";
      statusLabel = "PAYWALL METER EXHAUSTED";
    } else if (pct >= 80) {
      barColor = "bg-[#F59E0B]"; // amber 80-100%
      statusTextClass = "text-[#F59E0B]";
      statusLabel = "APPROACHING METER LIMIT";
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2E32] pb-3">
        <div>
          <h3 className="text-base font-bold text-[#FAFAFA]">
            Paywall Metered Access & Article Entitlements (IMP-021)
          </h3>
          <p className="text-xs text-[#A0A4A8]">
            Atomic Serializable metering in PostgreSQL RLS (<code className="font-mono text-[#FAFAFA]">paywall_entitlements</code>)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isUnlimited ? (
            <span className="rounded-full bg-[#0066CC]/20 px-3 py-1 text-xs font-bold text-[#3399FF] border border-[#0066CC]/40">
              ⚡ UNLIMITED ARTICLES
            </span>
          ) : (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold border ${statusTextClass} bg-black/30`}
            >
              {statusLabel}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between text-sm font-bold">
          <span className="text-[#FAFAFA]">
            Current Billing Cycle Usage ({usage.planTier} Tier):
          </span>
          <span className="font-mono text-base">
            {isUnlimited ? (
              <span className="text-[#3399FF]">Unlimited / Month</span>
            ) : (
              <span className={statusTextClass}>
                {usedNum} / {limitNum} Metered Articles
              </span>
            )}
          </span>
        </div>

        {/* Progress Bar */}
        {!isUnlimited && (
          <div className="space-y-1">
            <div className="h-3 w-full overflow-hidden rounded-full bg-[#2E2E32]">
              <div
                className={`h-3 transition-all duration-300 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#A0A4A8]">
              <span>0 articles</span>
              <span>{pct}% Consumed</span>
              <span>{limitNum} limit</span>
            </div>
          </div>
        )}

        {/* Reset Countdown Info */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#2E2E32] pt-3 text-xs">
          <span className="text-[#A0A4A8]">
            Resets in{" "}
            <strong className="text-[#FAFAFA]">{usage.resetsInDays} days</strong>{" "}
            (on {new Date(usage.resetDate).toLocaleDateString()})
          </span>

          {!isUnlimited && onUpgradePlan && (
            <button
              type="button"
              onClick={onUpgradePlan}
              className="rounded bg-[#0066CC] px-3 py-1 text-xs font-semibold text-white hover:bg-[#3399FF] transition-colors"
            >
              Upgrade to Premium ($29/mo) →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
