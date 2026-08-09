"use client";

import React, { useState } from "react";
import { AlertHistoryItem, AlertSeverity, AlertStatus } from "../types";

export interface AlertRowProps {
  alert: AlertHistoryItem;
  onAction: (action: "ACKNOWLEDGE" | "ESCALATE" | "RESOLVE", id: string) => void;
}

function getSeverityBadge(sev: AlertSeverity): { label: string; style: string } {
  switch (sev) {
    case "CRITICAL":
      return {
        label: "CRITICAL",
        style: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold",
      };
    case "WARNING":
      return {
        label: "WARNING",
        style: "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold",
      };
    case "INFO":
    default:
      return {
        label: "INFO",
        style: "bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/40 font-medium",
      };
  }
}

function getStatusBadge(status: AlertStatus): string {
  switch (status) {
    case "RESOLVED":
      return "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/30 font-bold";
    case "ACKNOWLEDGED":
      return "bg-[#3399FF]/20 text-[#3399FF] border border-[#3399FF]/30 font-semibold";
    case "ACTIVE":
    default:
      return "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/30 font-bold animate-pulse";
  }
}

export function AlertRow({ alert, onAction }: AlertRowProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const sev = getSeverityBadge(alert.severity);

  return (
    <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow transition-all hover:border-[#0066CC]">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${sev.style}`}
            >
              {sev.label}
            </span>
            <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-xs font-bold text-[#6C5CE7] border border-[#2E2E32]">
              {alert.type}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${getStatusBadge(
                alert.status,
              )}`}
            >
              Status: {alert.status}
            </span>
          </div>

          <h4 className="mt-2 text-sm font-bold text-[#FAFAFA]">
            {alert.message}
          </h4>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            Affected Component:{" "}
            <span className="font-semibold text-[#FAFAFA]">
              {alert.affectedServiceOrAgent}
            </span>{" "}
            · Occurred: {new Date(alert.occurredAt).toLocaleString()}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded border border-[#0066CC] bg-[#0066CC]/10 px-3 py-1.5 text-xs font-semibold text-[#3399FF] hover:bg-[#0066CC]/20"
          >
            {isExpanded ? "Hide Details ↑" : "Inspect Alert ↓"}
          </button>
          {alert.status === "ACTIVE" && (
            <button
              type="button"
              onClick={() => onAction("ACKNOWLEDGE", alert.id)}
              className="rounded bg-[#0066CC] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
            >
              Acknowledge
            </button>
          )}
          {alert.status !== "RESOLVED" && (
            <>
              <button
                type="button"
                onClick={() => onAction("ESCALATE", alert.id)}
                className="rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20"
              >
                Escalate
              </button>
              <button
                type="button"
                onClick={() => onAction("RESOLVE", alert.id)}
                className="rounded bg-[#0D9040] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0D9040]/80"
              >
                ✓ Resolve
              </button>
            </>
          )}
        </div>
      </div>

      {/* EXPANDED ALERT AUDIT LEDGER */}
      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-[#2E2E32] pt-4 text-xs">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3">
              <span className="font-semibold text-[#3399FF]">
                Audit Description &amp; Metrics:
              </span>
              <p className="mt-1 leading-relaxed text-[#FAFAFA]">
                Authoritative health telemetry triggered threshold exception on component{" "}
                <span className="font-mono font-bold">{alert.affectedServiceOrAgent}</span>.
              </p>
              {alert.resolutionNotes && (
                <div className="mt-2 rounded border border-[#0D9040]/40 bg-[#0D9040]/10 p-2 text-[#0D9040]">
                  <span className="font-bold">Resolution Note:</span> {alert.resolutionNotes}
                </div>
              )}
            </div>

            <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3">
              <span className="font-semibold text-[#3399FF]">
                Event Timeline Ledger:
              </span>
              {alert.timeline && alert.timeline.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {alert.timeline.map((t, idx) => (
                    <li key={idx} className="flex items-start justify-between">
                      <span className="text-[#FAFAFA]">{t.event}</span>
                      <span className="shrink-0 font-mono text-[10px] text-[#A0A4A8]">
                        {new Date(t.timestamp).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[#A0A4A8]">
                  Zero supplementary timeline events logged.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlertRow;
