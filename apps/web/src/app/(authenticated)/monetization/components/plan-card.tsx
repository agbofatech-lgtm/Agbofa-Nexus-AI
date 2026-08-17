"use client";

import React from "react";
import { SubscriptionPlanItem, PlanTier } from "../types";

export interface PlanCardProps {
  plan: SubscriptionPlanItem;
  currentPlanTier: PlanTier;
  onSelectPlan: (tier: PlanTier) => void;
}

export function PlanCard({
  plan,
  currentPlanTier,
  onSelectPlan,
}: PlanCardProps): React.JSX.Element {
  const isCurrentPlan = currentPlanTier === plan.id;

  const borderClass = plan.isHighlighted
    ? "border-2 border-[#0066CC] shadow-lg bg-[#12121A]"
    : "border border-[#2E2E32] bg-[#0A0A0B]";

  const ctaClass = isCurrentPlan
    ? "bg-[#2E2E32] text-[#A0A4A8] cursor-default"
    : plan.isHighlighted
    ? "bg-[#0066CC] text-white hover:bg-[#3399FF]"
    : "border border-[#2E2E32] bg-[#12121A] text-[#FAFAFA] hover:bg-[#2E2E32]";

  return (
    <div
      className={`flex flex-col justify-between rounded-lg p-6 transition-all ${borderClass}`}
    >
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#FAFAFA]">{plan.name}</h3>
          {plan.isHighlighted && (
            <span className="rounded-full bg-[#0066CC]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#3399FF] border border-[#0066CC]/40">
              POPULAR
            </span>
          )}
        </div>

        <div className="mb-4 flex items-baseline">
          <span className="font-mono text-3xl font-extrabold text-[#FAFAFA]">
            ${plan.priceMonthly}
          </span>
          <span className="ml-1 text-xs text-[#A0A4A8]">/ month</span>
        </div>

        <div className="mb-4 rounded bg-[#0A0A0B] p-2.5 text-xs font-mono text-[#3399FF] border border-[#2E2E32]">
          Metering:{" "}
          <strong>
            {plan.meteredArticlesPerMonth === "UNLIMITED"
              ? "Unlimited Verified Articles"
              : `${plan.meteredArticlesPerMonth} Metered Articles / month`}
          </strong>
        </div>

        <ul className="mb-6 space-y-2 text-xs text-[#A0A4A8]">
          {plan.features.map((feat, idx) => (
            <li key={idx} className="flex items-start space-x-2">
              <span className="mt-0.5 text-xs text-[#0D9040]">✓</span>
              <span className="text-[#FAFAFA]">{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 border-t border-[#2E2E32] pt-4">
        <div className="flex items-center justify-between text-[11px] text-[#A0A4A8]">
          <span>Support SLA:</span>
          <strong className="text-[#3399FF]">{plan.supportLevel}</strong>
        </div>

        <button
          type="button"
          disabled={isCurrentPlan}
          onClick={() => onSelectPlan(plan.id)}
          className={`w-full rounded-md py-2.5 text-xs font-semibold transition-colors ${ctaClass}`}
          aria-label={
            isCurrentPlan ? `Current Plan: ${plan.name}` : `Select ${plan.name}`
          }
        >
          {isCurrentPlan ? "Current Active Plan" : plan.ctaLabel}
        </button>
      </div>
    </div>
  );
}
