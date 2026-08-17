"use client";

import React from "react";
import { AgentBase, AgentHealthStatusType } from "../types";

export interface AgentCardProps {
  agent: AgentBase & {
    platform?: string;
    primaryMetricLabel?: string;
    primaryMetricValue?: string | number;
  };
  onClick: () => void;
}

function getPlatformIcon(platform?: string, squad?: string): string {
  if (!platform) {
    if (squad === "MONITORS") return "📡";
    if (squad === "DETECTORS") return "🔍";
    if (squad === "VERIFICATION") return "✓";
    return "⚡";
  }
  const upper = platform.toUpperCase();
  if (upper === "TWITTER" || upper === "X") return "𝕏";
  if (upper === "FACEBOOK") return "f";
  if (upper === "INSTAGRAM") return "IG";
  if (upper === "TIKTOK") return "TT";
  if (upper === "LINKEDIN") return "in";
  if (upper === "YOUTUBE") return "▶";
  if (upper === "REDDIT") return "r/";
  if (upper === "RSS") return "📰";
  return "⚡";
}

function getStatusBadge(status: AgentHealthStatusType): { label: string; style: string } {
  switch (status) {
    case "HEALTHY":
      return {
        label: "HEALTHY",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-bold",
      };
    case "DEGRADED":
      return {
        label: "DEGRADED",
        style: "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold",
      };
    case "RATE_LIMITED":
      return {
        label: "RATE LIMITED",
        style: "bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold",
      };
    case "AUTH_FAILED":
      return {
        label: "AUTH FAILED",
        style: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold",
      };
    case "OFFLINE":
    default:
      return {
        label: "OFFLINE",
        style: "bg-[#2E2E32]/50 text-[#A0A4A8] border border-[#2E2E32]",
      };
  }
}

export function AgentCard({ agent, onClick }: AgentCardProps): React.JSX.Element {
  const icon = getPlatformIcon(agent.platform, agent.squad);
  const statusBadge = getStatusBadge(agent.status);

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Agent ${agent.agentId}: ${agent.name}`}
      className="group flex flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow transition-all hover:border-[#0066CC] hover:shadow-md cursor-pointer"
    >
      <div>
        {/* Top Header: Platform Icon + ID + Status */}
        <div className="mb-2 flex items-center justify-between gap-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[#0A0A0B] text-xs font-bold text-[#3399FF] border border-[#2E2E32]">
              {icon}
            </span>
            <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-xs font-bold text-[#FAFAFA] border border-[#2E2E32]">
              {agent.agentId}
            </span>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${statusBadge.style}`}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* Agent Name */}
        <h3 className="mb-2 line-clamp-1 text-sm font-bold text-[#FAFAFA] group-hover:text-[#3399FF]">
          {agent.name}
        </h3>

        {/* Squad & Version */}
        <div className="mb-3 flex items-center justify-between text-xs text-[#A0A4A8]">
          <span className="rounded bg-[#0A0A0B] px-2 py-0.5 text-[10px] font-medium text-[#6C5CE7] border border-[#2E2E32]">
            {agent.squad} SQUAD
          </span>
          <span className="font-mono text-[11px]">v:{agent.version}</span>
        </div>
      </div>

      {/* Metrics Footer (Primary Metric + Uptime %) */}
      <div className="mt-3 flex items-center justify-between border-t border-[#2E2E32] pt-2 text-xs">
        <div>
          <div className="text-[10px] text-[#A0A4A8]">
            {agent.primaryMetricLabel || "Signals (24h)"}
          </div>
          <div className="font-bold text-[#FAFAFA]">
            {agent.primaryMetricValue !== undefined
              ? agent.primaryMetricValue
              : "Active"}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-[#A0A4A8]">Uptime</div>
          <div
            className={`font-mono font-bold ${
              agent.uptime >= 99 ? "text-[#0D9040]" : "text-amber-400"
            }`}
          >
            {agent.uptime}%
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentCard;
