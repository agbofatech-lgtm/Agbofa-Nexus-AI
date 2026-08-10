"use client";

import React, { useState } from "react";
import { AnomalyAlertItem, AnomalySeverity, AnomalyType } from "../types";

export interface AnomalyAlertProps {
  alert: AnomalyAlertItem;
  onConfirmAlert?: (id: string) => void;
  onSuppressAlert?: (id: string) => void;
}

function getSeverityBadge(sev: AnomalySeverity): { label: string; style: string } {
  switch (sev) {
    case "CRITICAL":
      return {
        label: "CRITICAL",
        style: "bg-[#CF2020] text-white font-bold animate-pulse",
      };
    case "HIGH":
      return {
        label: "HIGH SEVERITY",
        style: "bg-amber-500 text-black font-bold animate-pulse",
      };
    case "MEDIUM":
      return {
        label: "MEDIUM DEVIATION",
        style: "bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/40 font-semibold",
      };
    case "LOW":
    default:
      return {
        label: "LOW VARIANCE",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-semibold",
      };
  }
}

function getTypeBadge(type: AnomalyType): string {
  switch (type) {
    case "SPIKE":
      return "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold";
    case "DROP":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold";
    case "DIVERGENCE":
      return "bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/40 font-semibold";
    case "EMERGENCE":
    default:
      return "bg-[#3399FF]/20 text-[#3399FF] border border-[#3399FF]/40 font-semibold";
  }
}

export function AnomalyAlert({
  alert,
  onConfirmAlert,
  onSuppressAlert,
}: AnomalyAlertProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const sevBadge = getSeverityBadge(alert.severity);
  const typeStyle = getTypeBadge(alert.type);

  return (
    <div
      className={`rounded-lg border p-5 shadow transition-all ${
        alert.isSuppressed
          ? "border-[#2E2E32] bg-[#12121A]/60 opacity-70"
          : "border-amber-500/40 bg-[#12121A] hover:border-[#0066CC]"
      }`}
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${sevBadge.style}`}
            >
              ● {sevBadge.label}
            </span>
            <span
              className={`inline-flex rounded px-2 py-0.5 font-mono text-xs ${typeStyle}`}
            >
              {alert.type}
            </span>
            {alert.isSuppressed ? (
              <span className="rounded bg-[#2E2E32] px-2 py-0.5 text-[10px] font-bold text-[#A0A4A8]">
                SUPPRESSED ({alert.consecutiveConfirmations}/2 confirmations)
              </span>
            ) : (
              <span className="rounded bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040] border border-[#0D9040]/30">
                ✓ CONFIRMED ({alert.consecutiveConfirmations}+ consecutive)
              </span>
            )}
          </div>

          <h4 className="mt-2 text-base font-bold text-[#FAFAFA]">
            {alert.affectedMetric}
          </h4>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            Deviation:{" "}
            <strong
              className={`font-mono ${
                alert.deviationPct >= 0 ? "text-[#CF2020]" : "text-amber-400"
              }`}
            >
              {alert.deviationPct >= 0 ? "+" : ""}
              {alert.deviationPct}%
            </strong>{" "}
            from baseline · Detected {new Date(alert.detectedAt).toLocaleString()}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded border border-[#0066CC] bg-[#0066CC]/10 px-3 py-1.5 text-xs font-semibold text-[#3399FF] hover:bg-[#0066CC]/20"
          >
            {isExpanded ? "Hide Audit ↑" : "Inspect Anomaly ↓"}
          </button>
          {!alert.isSuppressed && onSuppressAlert && (
            <button
              type="button"
              onClick={() => onSuppressAlert(alert.id)}
              className="rounded border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1.5 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
            >
              Suppress
            </button>
          )}
          {alert.isSuppressed && onConfirmAlert && (
            <button
              type="button"
              onClick={() => onConfirmAlert(alert.id)}
              className="rounded bg-[#0D9040] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0D9040]/80"
            >
              Confirm Anomaly
            </button>
          )}
        </div>
      </div>

      {/* METRICS ROW: Baseline vs Current */}
      <div className="mt-4 grid grid-cols-3 gap-3 rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center text-xs">
        <div>
          <div className="text-[10px] text-[#A0A4A8]">Baseline Average</div>
          <div className="font-mono font-bold text-[#FAFAFA]">
            {alert.baselineValue.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#A0A4A8]">Current Value</div>
          <div
            className={`font-mono font-bold ${
              alert.currentValue > alert.baselineValue
                ? "text-[#CF2020]"
                : "text-amber-400"
            }`}
          >
            {alert.currentValue.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#A0A4A8]">False Positive Guard</div>
          <div className="font-bold text-[#0D9040]">
            {alert.consecutiveConfirmations} / 2 confirmed
          </div>
        </div>
      </div>

      {/* EXPANDED ANOMALY AUDIT LEDGER */}
      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-[#2E2E32] pt-4 text-xs">
          {alert.breakingNewsCorrelation && (
            <div className="rounded border border-[#0066CC]/40 bg-[#0066CC]/10 p-3">
              <span className="font-bold text-[#3399FF]">
                AGT-009 Breaking News Correlation Advisory:
              </span>
              <p className="mt-1 leading-relaxed text-[#FAFAFA]">
                {alert.breakingNewsCorrelation}
              </p>
            </div>
          )}

          <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3">
            <span className="font-bold text-[#FAFAFA]">
              PRED-005 Anomaly Detector Guard Policy:
            </span>
            <p className="mt-1 text-[#A0A4A8]">
              To eliminate transient noise and false positives, PRED-005 requires at least <strong className="text-[#FAFAFA]">2 consecutive confirmation periods</strong> before generating an unsuppressed alert.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnomalyAlert;
