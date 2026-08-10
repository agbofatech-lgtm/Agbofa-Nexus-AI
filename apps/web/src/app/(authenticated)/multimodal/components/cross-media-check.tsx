"use client";

import React from "react";
import { CrossMediaItem, ConsistencyVerdict } from "../types";

export interface CrossMediaCheckProps {
  analysis: CrossMediaItem;
}

const VERDICT_STYLES: Record<
  ConsistencyVerdict,
  { label: string; bgClass: string; textClass: string; borderClass: string; hex: string }
> = {
  CONSISTENT: {
    label: "CONSISTENT (ALIGNED)",
    bgClass: "bg-[#0D9040]/20",
    textClass: "text-[#0D9040]",
    borderClass: "border-[#0D9040]/40",
    hex: "#0D9040",
  },
  MINOR_INCONSISTENCY: {
    label: "MINOR INCONSISTENCY",
    bgClass: "bg-[#F59E0B]/20",
    textClass: "text-[#F59E0B]",
    borderClass: "border-[#F59E0B]/40",
    hex: "#F59E0B",
  },
  MAJOR_INCONSISTENCY: {
    label: "MAJOR INCONSISTENCY (CONTRADICTION)",
    bgClass: "bg-[#CF2020]/20",
    textClass: "text-[#CF2020]",
    borderClass: "border-[#CF2020]/40",
    hex: "#CF2020",
  },
  UNCORRELATED: {
    label: "UNCORRELATED (NO OVERLAP)",
    bgClass: "bg-[#A0A4A8]/20",
    textClass: "text-[#A0A4A8]",
    borderClass: "border-[#A0A4A8]/40",
    hex: "#A0A4A8",
  },
  NOT_APPLICABLE: {
    label: "NOT APPLICABLE (SINGLE MEDIA)",
    bgClass: "bg-[#3399FF]/20",
    textClass: "text-[#3399FF]",
    borderClass: "border-[#3399FF]/40",
    hex: "#3399FF",
  },
};

export function CrossMediaCheck({
  analysis,
}: CrossMediaCheckProps): React.JSX.Element {
  const overallStyle = VERDICT_STYLES[analysis.overallVerdict];

  return (
    <div className="space-y-6">
      {/* Policy Notice Card: Artistic Expression Never Flagged */}
      <div
        role="region"
        aria-label="Artistic Expression Policy"
        className="flex items-start justify-between rounded-lg border border-[#0066CC]/40 bg-[#0066CC]/10 p-4"
      >
        <div className="flex items-start space-x-3">
          <span className="text-lg">🎨</span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#3399FF]">
              Artistic Expression & Editorial Styling Guarantee (IMP-020 / AGT-013-CROSS)
            </h4>
            <p className="mt-0.5 text-xs text-[#FAFAFA]">
              Artistic expression never flagged as inconsistency.
            </p>
            <p className="mt-1 text-[11px] text-[#A0A4A8]">
              Stylized color filters, infographic lighting, or dramatized soundscapes are classified as artistic expression (<code className="font-mono text-[#FAFAFA]">isArtisticExpression = true</code>) and are never penalized as factual contradictions.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Verdict Bar */}
      <div
        style={{ borderColor: overallStyle.hex }}
        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 bg-[#12121A] p-5"
      >
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold border ${overallStyle.bgClass} ${overallStyle.textClass} ${overallStyle.borderClass}`}
            >
              ● {overallStyle.label}
            </span>
            <span className="rounded bg-[#2E2E32] px-2 py-0.5 font-mono text-xs font-semibold text-[#FAFAFA]">
              Penalty: {analysis.consistencyPenaltyScore.toFixed(2)}
            </span>
          </div>
          <h3 className="mt-2 text-base font-bold text-[#FAFAFA]">
            {analysis.title}
          </h3>
          <p className="mt-1 text-xs text-[#A0A4A8]">
            Agent: <strong className="text-[#3399FF]">{analysis.agentId}</strong> • Verified across {analysis.mediaTypesIncluded.join(" + ")}
          </p>
        </div>

        <div className="text-right">
          <span
            style={{ color: overallStyle.hex }}
            className="block font-mono text-3xl font-extrabold"
          >
            {(analysis.overallConfidenceScore * 100).toFixed(0)}%
          </span>
          <span className="text-xs font-medium text-[#A0A4A8]">
            Consistency Confidence
          </span>
        </div>
      </div>

      {/* Side-by-Side Comparison Panels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left Panel: Image OCR Text & Visual Scene */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2E2E32] pb-2">
            <span className="text-xs font-bold uppercase tracking-wide text-[#3399FF]">
              📷 Image OCR Text & Visual Asset
            </span>
            <span className="rounded bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-bold text-[#3399FF]">
              IMAGE MODALITY
            </span>
          </div>
          <p className="font-mono text-xs leading-relaxed text-[#FAFAFA]">
            {analysis.imageOcrSummary}
          </p>
          <p className="text-[11px] text-[#A0A4A8]">
            Visual Summary: {analysis.videoSceneSummary}
          </p>
        </div>

        {/* Right Panel: Spoken Audio Transcript */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2E2E32] pb-2">
            <span className="text-xs font-bold uppercase tracking-wide text-[#0D9040]">
              🎙️ Spoken Audio Transcription
            </span>
            <span className="rounded bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              AUDIO MODALITY
            </span>
          </div>
          <p className="font-mono text-xs leading-relaxed text-[#FAFAFA]">
            {analysis.audioTranscriptSummary}
          </p>
          <p className="text-[11px] text-[#A0A4A8]">
            Audio Diarization: Speaker statements aligned with timestamp ledgers
          </p>
        </div>
      </div>

      {/* Evidence Highlighting Grid (Red border = Contradictory, Green = Corroborating) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-[#FAFAFA]">
          Evidence Highlighting & Contradiction Flagging
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {analysis.evidenceHighlights.map((ev) => {
            const borderClass =
              ev.status === "CONTRADICTORY"
                ? "border-2 border-[#CF2020] bg-[#CF2020]/10"
                : ev.status === "CORROBORATING"
                ? "border-2 border-[#0D9040] bg-[#0D9040]/10"
                : "border border-[#2E2E32] bg-[#12121A]";

            const badgeText =
              ev.status === "CONTRADICTORY"
                ? "⚠ CONTRADICTORY (FLAGGED)"
                : ev.status === "CORROBORATING"
                ? "✓ CORROBORATING"
                : "● NEUTRAL (ARTISTIC)";

            const badgeColor =
              ev.status === "CONTRADICTORY"
                ? "text-[#CF2020]"
                : ev.status === "CORROBORATING"
                ? "text-[#0D9040]"
                : "text-[#A0A4A8]";

            return (
              <div
                key={ev.id}
                className={`flex flex-col justify-between rounded-lg p-3 ${borderClass}`}
              >
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#A0A4A8]">
                      {ev.elementType}
                    </span>
                    <span className={`text-[10px] font-bold ${badgeColor}`}>
                      {badgeText}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs font-semibold text-[#FAFAFA]">
                    &ldquo;{ev.content}&rdquo;
                  </p>
                </div>
                <p className="mt-2 text-[11px] text-[#A0A4A8]">
                  {ev.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Check Ledger Table */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#3399FF]">
          Per-Check Consistency Ledger (10 ContentDetector Methods)
        </h4>

        <div className="space-y-3">
          {analysis.checks.map((chk) => {
            const chkStyle = VERDICT_STYLES[chk.verdict];
            return (
              <div
                key={chk.id}
                style={{ borderLeftColor: chkStyle.hex }}
                className="rounded border border-l-4 border-[#2E2E32] bg-[#0A0A0B] p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[#FAFAFA]">
                    {chk.comparisonType}
                  </span>
                  <div className="flex items-center space-x-2">
                    {chk.isArtisticExpression && (
                      <span className="rounded bg-[#6C5CE7]/20 px-2 py-0.5 text-[10px] font-bold text-[#6C5CE7]">
                        🎨 Artistic Expression
                      </span>
                    )}
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${chkStyle.bgClass} ${chkStyle.textClass}`}
                    >
                      {chkStyle.label}
                    </span>
                    <span className="font-mono text-xs text-[#0D9040]">
                      {(chk.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-[#FAFAFA]">{chk.description}</p>

                {chk.flaggedElements.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-[#A0A4A8]">
                      Flagged Elements:
                    </span>
                    {chk.flaggedElements.map((elem, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-[#2E2E32] px-1.5 py-0.5 font-mono text-[10px] text-[#FAFAFA]"
                      >
                        {elem}
                      </span>
                    ))}
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
