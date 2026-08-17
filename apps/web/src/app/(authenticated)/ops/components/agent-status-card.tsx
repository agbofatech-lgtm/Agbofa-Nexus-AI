"use client";

import React from "react";
import { AgentFleetItem, AgentHealthStatus, AgentSquad } from "../types";

export interface AgentStatusCardProps {
  agent: AgentFleetItem;
  onSelectAgent: (agent: AgentFleetItem) => void;
  onAction: (action: "RESTART" | "DISABLE" | "QUOTA", agent: AgentFleetItem) => void;
}

function getSquadBadge(squad: AgentSquad): string {
  switch (squad) {
    case "Monitors":
      return "bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/30";
    case "Detectors":
      return "bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/30";
    case "Verification":
      return "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/30";
    case "Pipeline":
    default:
      return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  }
}

function getStatusBadge(status: AgentHealthStatus): string {
  switch (status) {
    case "HEALTHY":
      return "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-bold";
    case "DEGRADED":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold";
    case "RATE_LIMITED":
      return "bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold";
    case "AUTH_FAILED":
      return "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold";
    case "OFFLINE":
    default:
      return "bg-[#2E2E32]/50 text-[#A0A4A8] border border-[#2E2E32]";
  }
}

export function AgentStatusCard({
  agent,
  onSelectAgent,
  onAction,
}: AgentStatusCardProps): React.JSX.Element {
  const quotaPct = Math.round(
    (agent.tokensUsedToday / agent.rateLimitTotal) * 100,
  );

  return (
    <div
      onClick={() => onSelectAgent(agent)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectAgent(agent);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Agent card: ${agent.id} ${agent.name}`}
      className="flex flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow transition-all hover:border-[#0066CC] hover:shadow-md cursor-pointer"
    >
      <div>
        {/* Top Header: ID & Squad */}
        <div className="mb-2 flex items-center justify-between gap-1">
          <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-xs font-bold text-[#3399FF] border border-[#2E2E32]">
            {agent.id}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getSquadBadge(
              agent.squad,
            )}`}
          >
            {agent.squad}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${getStatusBadge(
              agent.status,
            )}`}
          >
            {agent.status}
          </span>
        </div>

        {/* Agent Name */}
        <h4 className="mb-3 line-clamp-1 text-sm font-bold text-[#FAFAFA]">
          {agent.name}
        </h4>

        {/* Technical Telemetry Grid (3 columns: Uptime, p95, Error rate) */}
        <div className="mb-3 grid grid-cols-3 gap-1 rounded border border-[#2E2E32] bg-[#0A0A0B] p-2 text-center text-[11px]">
          <div>
            <div className="text-[10px] text-[#A0A4A8]">Uptime</div>
            <div className="font-bold text-[#0D9040]">
              {agent.uptimePercentage}%
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#A0A4A8]">p95 Latency</div>
            <div className="font-bold text-[#3399FF]">
              {agent.p95LatencyMs}ms
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#A0A4A8]">24h Err Rate</div>
            <div
              className={`font-bold ${
                agent.errorRate24h > 1 ? "text-[#CF2020]" : "text-[#FAFAFA]"
              }`}
            >
              {agent.errorRate24h}%
            </div>
          </div>
        </div>

        {/* Quota Progress Bar */}
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between text-[#A0A4A8]">
            <span>Tokens Today:</span>
            <span className="font-bold text-[#FAFAFA]">
              {(agent.tokensUsedToday / 1000).toFixed(1)}k / {(agent.rateLimitTotal / 1000).toFixed(0)}k ({quotaPct}%)
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
            <div
              className={`h-full transition-all ${
                quotaPct >= 90
                  ? "bg-[#CF2020]"
                  : quotaPct >= 75
                  ? "bg-amber-500"
                  : "bg-[#0066CC]"
              }`}
              style={{ width: `${Math.min(100, quotaPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div
        className="mt-4 flex items-center justify-between border-t border-[#2E2E32] pt-2 text-[11px]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[#A0A4A8]">
          Checked: {new Date(agent.lastCheckedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onAction("QUOTA", agent)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-1.5 py-0.5 font-medium text-[#FAFAFA] hover:border-[#0066CC]"
            title="Adjust rate limit quota"
          >
            Quota
          </button>
          <button
            type="button"
            onClick={() => onAction("RESTART", agent)}
            className="rounded bg-[#0066CC] px-2 py-0.5 font-semibold text-white hover:bg-[#3399FF]"
            title="Restart agent runtime process"
          >
            ↻ Restart
          </button>
        </div>
      </div>
    </div>
  );
}

export default AgentStatusCard;
