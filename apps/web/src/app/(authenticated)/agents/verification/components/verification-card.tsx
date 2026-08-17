"use client";

import React, { useState } from "react";
import { FactCheckVerdictItem, ClaimVerdictType, ClaimCategory } from "../types";

export interface VerificationCardProps {
  claim: FactCheckVerdictItem;
}

function getVerdictBadge(verdict: ClaimVerdictType): { label: string; style: string } {
  switch (verdict) {
    case "TRUE":
      return {
        label: "TRUE",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-bold",
      };
    case "FALSE":
      return {
        label: "FALSE",
        style: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold",
      };
    case "MISLEADING":
      return {
        label: "MISLEADING",
        style: "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 font-bold",
      };
    case "HALF_TRUE":
      return {
        label: "HALF TRUE",
        style: "bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/40 font-bold",
      };
    case "UNVERIFIED":
    default:
      return {
        label: "UNVERIFIED",
        style: "bg-[#2E2E32]/50 text-[#A0A4A8] border border-[#2E2E32]",
      };
  }
}

function getCategoryBadge(type: ClaimCategory): { label: string; style: string } {
  switch (type) {
    case "FACTUAL":
      return { label: "FACTUAL", style: "bg-[#0066CC]/20 text-[#3399FF]" };
    case "OPINION":
      return { label: "OPINION", style: "bg-[#6C5CE7]/20 text-[#6C5CE7]" };
    case "PREDICTION":
      return { label: "PREDICTION", style: "bg-[#3399FF]/20 text-[#3399FF]" };
    case "STATISTICAL":
      return { label: "STATISTICAL", style: "bg-amber-500/20 text-amber-400" };
    case "QUOTATION":
    default:
      return { label: "QUOTATION", style: "bg-[#2E2E32]/50 text-[#A0A4A8]" };
  }
}

export function VerificationCard({ claim }: VerificationCardProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const verdict = getVerdictBadge(claim.verdict);
  const category = getCategoryBadge(claim.claimType);

  return (
    <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow transition-all hover:border-[#0066CC]">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[11px] font-bold ${category.style}`}
          >
            {category.label}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${verdict.style}`}
          >
            {verdict.label}
          </span>
          <span className="rounded bg-[#0A0A0B] px-2 py-0.5 text-xs font-bold text-[#0D9040] border border-[#2E2E32]">
            {(claim.confidence * 100).toFixed(0)}% Confidence
          </span>
          <span className="text-xs text-[#A0A4A8]">
            🔗 {claim.sources.length} sources
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded border border-[#0066CC] bg-[#0066CC]/10 px-3 py-1 text-xs font-semibold text-[#3399FF] hover:bg-[#0066CC]/20"
        >
          {isExpanded ? "Hide Details ↑" : "Inspect Verification ↓"}
        </button>
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-semibold text-[#FAFAFA]">
        &ldquo;{claim.claimText}&rdquo;
      </p>
      <div className="mt-1 text-[11px] text-[#A0A4A8]">
        ID: {claim.claimId} · Verified at {new Date(claim.timestamp).toLocaleTimeString()}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-[#2E2E32] pt-4 text-xs">
          {claim.explanation && (
            <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3">
              <div className="font-bold text-[#3399FF]">Verification Explanation:</div>
              <p className="mt-1 leading-relaxed text-[#FAFAFA]">
                {claim.explanation}
              </p>
            </div>
          )}

          {claim.aiAnalysisSummary && (
            <div className="rounded border border-[#6C5CE7]/40 bg-[#6C5CE7]/10 p-3">
              <div className="font-bold text-[#6C5CE7]">AIGatewayService Analysis:</div>
              <p className="mt-1 text-[#FAFAFA]">{claim.aiAnalysisSummary}</p>
            </div>
          )}

          {claim.sources && claim.sources.length > 0 && (
            <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3">
              <div className="font-bold text-[#A0A4A8]">Cited Reference Sources:</div>
              <ul className="mt-1.5 space-y-1">
                {claim.sources.map((src, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="font-semibold text-[#FAFAFA]">{src.name}</span>
                    <a
                      href={src.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-[#3399FF] hover:underline"
                    >
                      {src.url || src.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VerificationCard;
