"use client";

import React, { useState } from "react";
import {
  VerificationClaim,
  MisinformationFlag,
  BiasDetection,
  ConfidenceBreakdown,
  ClaimVerdict,
} from "../types";
import { EvidenceViewer } from "./evidence-viewer";

export interface VerificationPanelProps {
  storyTitle: string;
  claims: VerificationClaim[];
  misinfo: MisinformationFlag;
  bias: BiasDetection;
  confidence: ConfidenceBreakdown;
  onVerifyStory: () => void;
  onDisputeClaim: (claimId: string) => void;
  onRequestEvidence: (claimId: string) => void;
  onRouteToFactory: () => void;
  onRouteToOrigination: () => void;
}

function getVerdictStyle(verdict: ClaimVerdict): string {
  switch (verdict) {
    case "TRUE":
      return "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40";
    case "FALSE":
      return "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40";
    case "MISLEADING":
    case "HALF_TRUE":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/40";
    case "UNVERIFIED":
    default:
      return "bg-[#3399FF]/20 text-[#3399FF] border border-[#3399FF]/40";
  }
}

function getTierBadge(tier: string): { label: string; style: string } {
  if (tier === "VERIFIED_TRUTH") {
    return {
      label: "VERIFIED TRUTH (≥ 90%)",
      style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40",
    };
  }
  if (tier === "PROVISIONAL") {
    return {
      label: "PROVISIONAL (70%–89%)",
      style: "bg-[#3399FF]/20 text-[#3399FF] border border-[#3399FF]/40",
    };
  }
  return {
    label: "DOUBTFUL (< 70%)",
    style: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40",
  };
}

export function VerificationPanel({
  storyTitle,
  claims,
  misinfo,
  bias,
  confidence,
  onVerifyStory,
  onDisputeClaim,
  onRequestEvidence,
  onRouteToFactory,
  onRouteToOrigination,
}: VerificationPanelProps): React.JSX.Element {
  const [activeClaimId, setActiveClaimId] = useState<string | null>(
    claims.length > 0 ? claims[0].claimId : null,
  );

  const tierBadge = getTierBadge(confidence.tier);

  return (
    <div className="space-y-6">
      {/* Top Header & Verification Action Buttons */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#2E2E32] pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">{storyTitle}</h2>
          <p className="text-xs text-[#A0A4A8]">
            AGT-017 / AGT-018 / AGT-019 Autonomous Verification Analysis
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onVerifyStory}
            className="rounded-md bg-[#0D9040] px-3.5 py-1.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#0D9040]/80 transition-colors"
          >
            ✓ Verify Story (Approve All)
          </button>
          <button
            type="button"
            onClick={onRouteToFactory}
            className="rounded-md bg-[#0066CC] px-3.5 py-1.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF] transition-colors"
          >
            Route to Factory →
          </button>
          <button
            type="button"
            onClick={onRouteToOrigination}
            className="rounded-md border border-[#CF2020] bg-[#12121A] px-3.5 py-1.5 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/10 transition-colors"
          >
            ↩ Return to Origination
          </button>
        </div>
      </div>

      {/* Overview Grid: Overall Confidence Breakdown, Misinfo Risk, and Bias Detection */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1: Confidence Breakdown (30/25/20/15/10) */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A0A4A8]">
              Overall Confidence Breakdown
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tierBadge.style}`}
            >
              {tierBadge.label}
            </span>
          </div>
          <div className="mb-3 text-2xl font-bold text-[#FAFAFA]">
            {(confidence.overallConfidence * 100).toFixed(1)}%
          </div>
          {/* Visual Progress Bar */}
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
            <div
              className="h-full bg-gradient-to-r from-[#0066CC] to-[#0D9040]"
              style={{ width: `${Math.round(confidence.overallConfidence * 100)}%` }}
            />
          </div>
          <div className="space-y-1 text-[11px] text-[#A0A4A8]">
            <div className="flex justify-between">
              <span>Fact-Check (30% weight):</span>
              <span className="font-semibold text-[#FAFAFA]">
                {(confidence.factCheckScore * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cross-Ref (25% weight):</span>
              <span className="font-semibold text-[#FAFAFA]">
                {(confidence.crossRefScore * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Source Credibility (20% weight):</span>
              <span className="font-semibold text-[#FAFAFA]">
                {(confidence.sourceScore * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Evidence Ledger (15% weight):</span>
              <span className="font-semibold text-[#FAFAFA]">
                {(confidence.evidenceScore * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Bias Check (10% weight):</span>
              <span className="font-semibold text-[#FAFAFA]">
                {(confidence.biasScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Misinformation Flags */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A0A4A8]">
              Misinformation Risk Profile
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                misinfo.riskClass === "CLEAN"
                  ? "bg-[#0D9040]/20 text-[#0D9040]"
                  : "bg-[#CF2020]/20 text-[#CF2020]"
              }`}
            >
              {misinfo.riskClass} · {misinfo.severity}
            </span>
          </div>
          <div className="mb-3 text-2xl font-bold text-[#FAFAFA]">
            Risk Score: {(misinfo.riskScore * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-[#A0A4A8]">
            <div className="mb-1 font-semibold text-[#FAFAFA]">
              Contributing Factors:
            </div>
            <ul className="list-inside list-disc space-y-1 text-[11px]">
              {misinfo.contributingFactors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Card 3: Bias Detection */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A0A4A8]">
              Bias Classification
            </span>
            <span className="rounded-full bg-[#6C5CE7]/20 px-2 py-0.5 text-[10px] font-bold text-[#6C5CE7]">
              {bias.classification}
            </span>
          </div>
          <div className="mb-3 text-2xl font-bold text-[#FAFAFA]">
            Severity: {(bias.severityScore * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-[#A0A4A8]">
            <div className="mb-1 font-semibold text-[#FAFAFA]">
              Identified Bias Indicators:
            </div>
            <div className="max-h-24 space-y-1.5 overflow-y-auto pr-1">
              {bias.indicators.map((ind, i) => (
                <div
                  key={i}
                  className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-1.5 text-[11px]"
                >
                  <div className="font-semibold text-[#FAFAFA]">
                    &ldquo;{ind.textExample}&rdquo;
                  </div>
                  <div className="text-[#A0A4A8]">{ind.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Claims Ledger */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[#FAFAFA]">
          Extracted Factual Claims ({claims.length} claims detected by AGT-020)
        </h3>
        <div className="space-y-4">
          {claims.map((claim) => {
            const isSelected = activeClaimId === claim.claimId;
            return (
              <div
                key={claim.claimId}
                onClick={() => setActiveClaimId(claim.claimId)}
                className={`rounded-lg border p-4 transition-all ${
                  isSelected
                    ? "border-[#0066CC] bg-[#12121A] shadow-md"
                    : "border-[#2E2E32] bg-[#12121A]/60 hover:border-[#2E2E32]/80"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="rounded bg-[#0A0A0B] px-2 py-0.5 text-xs font-bold text-[#3399FF] border border-[#2E2E32]">
                      {claim.claimType}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getVerdictStyle(claim.verdict)}`}
                    >
                      Verdict: {claim.verdict}
                    </span>
                    <span className="text-xs font-semibold text-[#0D9040]">
                      {(claim.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDisputeClaim(claim.claimId);
                      }}
                      className="rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 hover:bg-amber-500/20"
                    >
                      Dispute Claim
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestEvidence(claim.claimId);
                      }}
                      className="rounded border border-[#0066CC] bg-[#0066CC]/10 px-2.5 py-1 text-xs font-medium text-[#3399FF] hover:bg-[#0066CC]/20"
                    >
                      + Request More Evidence
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-sm font-semibold text-[#FAFAFA]">
                  &ldquo;{claim.claimText}&rdquo;
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#A0A4A8]">
                  <span>Cross-Ref: {claim.crossRefStatus}</span>
                  <span>·</span>
                  <span>Source Verification: {claim.sourceVerification}</span>
                </div>

                {/* Render EvidenceViewer for active/selected claim */}
                {isSelected && (
                  <div className="mt-4 border-t border-[#2E2E32] pt-3">
                    <EvidenceViewer
                      claimId={claim.claimId}
                      evidenceList={claim.evidence}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VerificationPanel;
