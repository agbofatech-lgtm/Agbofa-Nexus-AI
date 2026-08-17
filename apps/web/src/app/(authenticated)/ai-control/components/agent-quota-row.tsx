"use client";

import React from "react";
import { AgentQuotaItem, QuotaLimitStatus } from "../types";

export interface AgentQuotaRowProps {
  agent: AgentQuotaItem;
  onAdjustLimit?: (agent: AgentQuotaItem) => void;
}

function getLimitStyle(status: QuotaLimitStatus): { label: string; style: string } {
  switch (status) {
    case "EXCEEDED":
      return {
        label: "EXCEEDED",
        style: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold",
      };
    case "WARNING":
      return {
        label: "WARNING (> 80%)",
        style: "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold",
      };
    case "OK":
    default:
      return {
        label: "OK",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-semibold",
      };
  }
}

export function AgentQuotaRow({ agent, onAdjustLimit }: AgentQuotaRowProps): React.JSX.Element {
  const percentage = Math.min(
    100,
    Math.round((agent.tokensUsedToday / agent.dailyTokenLimit) * 100),
  );
  const badge = getLimitStyle(agent.rateLimitStatus);

  return (
    <tr className="border-b border-[#2E2E32] transition-colors hover:bg-[#0066CC]/10">
      {/* Agent ID & Name */}
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-xs font-bold text-[#3399FF] border border-[#2E2E32]">
            {agent.agentId}
          </span>
          <span className="font-bold text-[#FAFAFA]">{agent.agentName}</span>
        </div>
      </td>

      {/* Squad */}
      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#A0A4A8]">
        <span className="rounded bg-[#12121A] px-2 py-1 text-xs font-medium text-[#6C5CE7] border border-[#2E2E32]">
          {agent.squad}
        </span>
      </td>

      {/* Tokens Used / Daily Limit + Progress Bar */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#FAFAFA]">
            {agent.tokensUsedToday.toLocaleString()}
          </span>
          <span className="text-[#A0A4A8]">
            / {agent.dailyTokenLimit.toLocaleString()} ({percentage}%)
          </span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
          <div
            className={`h-full transition-all ${
              percentage >= 100
                ? "bg-[#CF2020]"
                : percentage >= 80
                ? "bg-amber-500"
                : "bg-[#0066CC]"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </td>

      {/* Rate Limit Status Badge */}
      <td className="whitespace-nowrap px-4 py-3 text-center">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${badge.style}`}
        >
          {badge.label}
        </span>
      </td>

      {/* Cost Estimate */}
      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs font-bold text-[#FAFAFA]">
        ${agent.estimatedCostUsd.toFixed(2)}
      </td>

      {/* Action */}
      <td className="whitespace-nowrap px-4 py-3 text-right">
        {onAdjustLimit && (
          <button
            type="button"
            onClick={() => onAdjustLimit(agent)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2.5 py-1 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC] hover:text-[#3399FF]"
          >
            Adjust Limit
          </button>
        )}
      </td>
    </tr>
  );
}

export default AgentQuotaRow;
