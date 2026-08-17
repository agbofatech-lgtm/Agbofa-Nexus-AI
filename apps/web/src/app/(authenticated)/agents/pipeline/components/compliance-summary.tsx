"use client";

import React from "react";
import { ComplianceScanData } from "../types";

export interface ComplianceSummaryProps {
  data: ComplianceScanData;
}

export function ComplianceSummary({
  data,
}: ComplianceSummaryProps): React.JSX.Element {
  const total = Math.max(
    data.statusCounts.cleared +
      data.statusCounts.reviewRequired +
      data.statusCounts.flagged +
      data.statusCounts.blocked,
    1,
  );
  const fairUsePct = Math.round(data.fairUseAvgScore * 100);

  const factorList = [
    { name: "Copyright Infringement Scan", passed: data.factorScans.copyright },
    { name: "Fair Use Assessment Ledger", passed: data.factorScans.fairUse },
    { name: "Media Asset Licensing Validation", passed: data.factorScans.licensing },
    { name: "Defamation / Libel Risk Scan", passed: data.factorScans.libel },
    { name: "Personal Privacy / GDPR Clearance", passed: data.factorScans.privacy },
    { name: "Embargo Timestamp Check", passed: data.factorScans.embargo },
  ];

  return (
    <div className="space-y-6">
      {/* Policy Reminder Display Card */}
      <div className="rounded-lg border-2 border-[#6C5CE7] bg-[#6C5CE7]/10 p-5 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-[#6C5CE7]">⚖</span>
          <h4 className="text-sm font-bold tracking-wide text-[#FAFAFA]">
            AUTHORITATIVE EDITORIAL SOVEREIGNTY POLICY (AGT-028)
          </h4>
        </div>
        <p className="mt-2 font-mono text-xs font-bold uppercase tracking-wider text-[#6C5CE7]">
          NEVER SUPPRESSES — FLAGS ONLY, HUMAN DECIDES
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#FAFAFA]">
          AGT-028 Compliance Pre-Checker evaluates 6 statutory risk factors and attaches diagnostic compliance flags to the package ledger. Autonomous agents never censor or suppress publication; editorial release decisions remain strictly under human control.
        </p>
      </div>

      {/* 1. Status Breakdown (CLEARED #0D9040, REVIEW_REQUIRED #F59E0B, FLAGGED #CF2020, BLOCKED #CF2020) */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <div className="mb-4 flex items-center justify-between border-b border-[#2E2E32] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              AGT-028 Compliance Pre-Check Status Breakdown ({total.toLocaleString()} packages scanned)
            </h3>
            <p className="text-xs text-[#A0A4A8]">
              CLEARED · REVIEW_REQUIRED · FLAGGED · BLOCKED
            </p>
          </div>
          <span className="rounded-full bg-[#0D9040]/20 px-3 py-1 text-xs font-bold text-[#0D9040]">
            ✓ 96.2% CLEARED
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded border border-[#0D9040]/30 bg-[#0D9040]/10 p-4">
            <div className="text-xs font-bold text-[#0D9040]">
              CLEARED — #0D9040
            </div>
            <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
              {data.statusCounts.cleared.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#A0A4A8]">Zero compliance flags</div>
          </div>

          <div className="rounded border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="text-xs font-bold text-amber-400">
              REVIEW_REQUIRED — #F59E0B
            </div>
            <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
              {data.statusCounts.reviewRequired.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#A0A4A8]">Editorial inspection</div>
          </div>

          <div className="rounded border border-[#CF2020]/30 bg-[#CF2020]/10 p-4">
            <div className="text-xs font-bold text-[#CF2020]">
              FLAGGED — #CF2020
            </div>
            <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
              {data.statusCounts.flagged.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#A0A4A8]">Statutory risk flag</div>
          </div>

          <div className="rounded border border-[#CF2020]/40 bg-[#CF2020]/20 p-4">
            <div className="text-xs font-bold text-[#CF2020]">
              BLOCKED — #CF2020
            </div>
            <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
              {data.statusCounts.blocked.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#A0A4A8]">Embargo / legal hold</div>
          </div>
        </div>
      </div>

      {/* 2. 6-Factor Scan Results & Fair Use Gauge (2 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 6-Factor Scan Results */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow lg:col-span-2">
          <h3 className="mb-3 text-sm font-bold text-[#FAFAFA]">
            6-Factor Statutory &amp; Editorial Compliance Scan Results
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {factorList.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-xs"
              >
                <span className="font-semibold text-[#FAFAFA]">{f.name}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    f.passed
                      ? "bg-[#0D9040]/20 text-[#0D9040]"
                      : "bg-[#CF2020]/20 text-[#CF2020]"
                  }`}
                >
                  {f.passed ? "✔ PASSED" : "✕ FLAGGED"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fair Use Score Gauge */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow lg:col-span-1">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
            Fair Use Assessment Score
          </h3>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#2E2E32"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#0D9040"
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - fairUsePct / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-bold text-[#0D9040]">
                  {fairUsePct}%
                </span>
                <span className="text-[9px] font-semibold text-[#A0A4A8]">
                  FAIR USE
                </span>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-[#FAFAFA]">
              Statutory 4-factor fair use balance score
            </p>
          </div>
        </div>
      </div>

      {/* 3. Recent Flags with Remediation Steps */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
          Recent Compliance Flags &amp; Authoritative Remediation Ledger
        </h3>
        {data.recentFlags.length === 0 ? (
          <p className="text-xs text-[#0D9040]">
            ✓ Zero compliance flags logged in the selected operational window.
          </p>
        ) : (
          <div className="space-y-3">
            {data.recentFlags.map((flg) => (
              <div
                key={flg.id}
                className="flex flex-col justify-between gap-2 rounded border border-[#CF2020]/30 bg-[#CF2020]/10 p-4 text-xs sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-[11px] font-bold text-[#CF2020]">
                      {flg.id}
                    </span>
                    <span className="font-bold text-[#FAFAFA]">{flg.title}</span>
                  </div>
                  <p className="mt-1 font-semibold text-amber-400">
                    Risk Factor: {flg.riskFactor}
                  </p>
                  <p className="mt-1 text-[#FAFAFA]">
                    Remediation Step: <strong className="text-[#3399FF]">{flg.remediationStep}</strong>
                  </p>
                </div>
                <span className="text-[11px] text-[#A0A4A8]">
                  {new Date(flg.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplianceSummary;
