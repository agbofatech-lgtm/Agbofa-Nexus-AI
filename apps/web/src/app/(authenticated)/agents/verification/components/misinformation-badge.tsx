"use client";

import React from "react";
import { MisinfoClassificationType } from "../types";

export interface MisinformationBadgeProps {
  classification: MisinfoClassificationType;
  riskScore: number; // 0.0 to 1.0
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  contributingFactors?: string[];
  intentDistinction?: string;
  recommendedAction?: string;
}

function getClassStyle(cls: MisinfoClassificationType): {
  color: string;
  bg: string;
  border: string;
  label: string;
  description: string;
} {
  switch (cls) {
    case "CLEAN":
      return {
        color: "text-[#0D9040]",
        bg: "bg-[#0D9040]/20",
        border: "border-[#0D9040]/40",
        label: "CLEAN (NO RISK)",
        description: "No misinformation or deception risk factors detected.",
      };
    case "SATIRE":
      return {
        color: "text-[#6C5CE7]",
        bg: "bg-[#6C5CE7]/20",
        border: "border-[#6C5CE7]/40",
        label: "SATIRE / HUMOR",
        description: "Humorous or satirical intent, not intentionally deceptive.",
      };
    case "MISINFORMATION":
      return {
        color: "text-amber-400",
        bg: "bg-amber-500/20",
        border: "border-amber-500/40",
        label: "MISINFORMATION",
        description: "False information shared without intentional harm.",
      };
    case "DISINFORMATION":
      return {
        color: "text-[#CF2020]",
        bg: "bg-[#CF2020]/20",
        border: "border-[#CF2020]/40",
        label: "DISINFORMATION (CRITICAL)",
        description: "Intentionally false and harmful coordinated deception.",
      };
    case "MALINFORMATION":
    default:
      return {
        color: "text-[#CF2020]",
        bg: "bg-[#CF2020]/20",
        border: "border-[#CF2020]/40",
        label: "MALINFORMATION (CRITICAL)",
        description: "True information weaponized or leaked out of context to harm.",
      };
  }
}

function getSeverityColor(sev: string): string {
  switch (sev) {
    case "CRITICAL":
      return "text-[#CF2020] bg-[#CF2020]/20 border-[#CF2020]/40";
    case "HIGH":
      return "text-amber-400 bg-amber-500/20 border-amber-500/40";
    case "MEDIUM":
      return "text-[#3399FF] bg-[#0066CC]/20 border-[#0066CC]/40";
    case "LOW":
    default:
      return "text-[#0D9040] bg-[#0D9040]/20 border-[#0D9040]/40";
  }
}

export function MisinformationBadge({
  classification,
  riskScore,
  severity,
  contributingFactors = [],
  intentDistinction,
  recommendedAction,
}: MisinformationBadgeProps): React.JSX.Element {
  const clsStyle = getClassStyle(classification);
  const sevStyle = getSeverityColor(severity);
  const percentage = Math.round(riskScore * 100);

  return (
    <div className="space-y-6">
      {/* Risk Profile Card */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#2E2E32] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              AGT-023 Misinformation Risk Profile &amp; Classification
            </h3>
            <p className="text-xs text-[#A0A4A8]">
              {clsStyle.description}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold border ${clsStyle.bg} ${clsStyle.color} ${clsStyle.border}`}
            >
              ● {clsStyle.label}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold border ${sevStyle}`}
            >
              SEVERITY: {severity}
            </span>
          </div>
        </div>

        {/* Risk Score Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#FAFAFA]">
              Composite Misinformation Risk Score:
            </span>
            <span
              className={`font-mono text-sm font-bold ${
                percentage >= 80
                  ? "text-[#CF2020]"
                  : percentage >= 50
                  ? "text-amber-400"
                  : "text-[#0D9040]"
              }`}
            >
              {percentage}% ({riskScore.toFixed(2)})
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
            <div
              className={`h-full transition-all ${
                percentage >= 80
                  ? "bg-[#CF2020]"
                  : percentage >= 50
                  ? "bg-amber-500"
                  : "bg-[#0D9040]"
              }`}
              style={{ width: `${Math.max(2, percentage)}%` }}
            />
          </div>
        </div>

        {/* Intent Distinction & Recommended Action */}
        {(intentDistinction || recommendedAction) && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#2E2E32] pt-4 md:grid-cols-2">
            {intentDistinction && (
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-xs">
                <span className="font-bold text-[#3399FF]">
                  Intent Distinction Analysis:
                </span>
                <p className="mt-1 leading-relaxed text-[#FAFAFA]">
                  {intentDistinction}
                </p>
              </div>
            )}
            {recommendedAction && (
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-xs">
                <span className="font-bold text-amber-400">
                  Recommended Action (for Human Editorial Review):
                </span>
                <p className="mt-1 leading-relaxed text-[#FAFAFA]">
                  {recommendedAction}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contributing Factors List */}
        {contributingFactors.length > 0 && (
          <div className="mt-4 border-t border-[#2E2E32] pt-3 text-xs">
            <div className="font-bold text-[#A0A4A8]">
              Key Contributing Factors ({contributingFactors.length}):
            </div>
            <ul className="mt-2 space-y-1 text-[#FAFAFA]">
              {contributingFactors.map((fact, i) => (
                <li key={i} className="flex items-start">
                  <span className="mr-2 text-[#CF2020]">▪</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mandatory Critical Policy Display Card (Border #6C5CE7) */}
      <div className="rounded-lg border-2 border-[#6C5CE7] bg-[#6C5CE7]/10 p-5 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-[#6C5CE7]">🛡</span>
          <h4 className="text-sm font-bold tracking-wide text-[#FAFAFA]">
            AUTHORITATIVE EDITORIAL SOVEREIGNTY POLICY
          </h4>
        </div>
        <p className="mt-2 font-mono text-xs font-bold uppercase tracking-wider text-[#6C5CE7]">
          NEVER SUPPRESSES CONTENT — FLAGS ONLY, HUMAN DECIDES ACTION
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#FAFAFA]">
          AGT-023 evaluates content risk and attaches diagnostic metadata to the story package. Autonomous agents never suppress, censor, or drop stories based on misinformation flags; all final publishing decisions remain strictly under human editorial control.
        </p>
      </div>
    </div>
  );
}

export default MisinformationBadge;
