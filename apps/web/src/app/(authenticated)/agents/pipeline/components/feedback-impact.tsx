"use client";

import React from "react";
import { FeedbackImpactData } from "../types";

export interface FeedbackImpactProps {
  data: FeedbackImpactData;
}

export function FeedbackImpact({ data }: FeedbackImpactProps): React.JSX.Element {
  const maxAcc = Math.max(
    ...data.accuracyTrendSeries.map((d) => d.accuracyPct),
    100,
  );

  return (
    <div className="space-y-6">
      {/* Policy Reminder Display Card */}
      <div className="rounded-lg border-2 border-[#0066CC] bg-[#0066CC]/10 p-5 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-[#3399FF]">🛡</span>
          <h4 className="text-sm font-bold tracking-wide text-[#FAFAFA]">
            AUTHORITATIVE CLOSED-LOOP GOVERNANCE POLICY (AGT-031)
          </h4>
        </div>
        <p className="mt-2 font-mono text-xs font-bold uppercase tracking-wider text-[#3399FF]">
          NEVER MODIFIES AGENT CODE — DATA UPDATES ONLY
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#FAFAFA]">
          AGT-031 Learning Feedback Loop adjusts MAPE virality weights, source credibility reliability scores, and prompt calibration ledgers in PostgreSQL. Autonomous agents never alter compiled binaries or service code; all system code remains immutable.
        </p>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Models Updated (24h)
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {data.modelsUpdated24h}{" "}
            <span className="text-xs font-semibold text-[#0D9040]">
              ▲ +{data.trendChangePct}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Calibration ledgers updated
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Source Credibility Adjustments
          </div>
          <div className="mt-2 flex items-baseline space-x-2 text-xl font-bold">
            <span className="text-[#0D9040]">+{data.credibilityChanges.increased} ↑</span>
            <span className="text-[#A0A4A8]">/</span>
            <span className="text-[#CF2020]">-{data.credibilityChanges.decreased} ↓</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            AGT-019 reliability scores
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Accuracy Drift Alerts
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {data.driftAlertsCount}
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            MAPE variance threshold (&gt;5%)
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Bias Creep Alerts
          </div>
          <div className="mt-2 text-2xl font-bold text-[#6C5CE7]">
            {data.biasCreepAlertsCount}
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            AGT-022 severity drift check
          </div>
        </div>
      </div>

      {/* Accuracy Trend Series Bar Chart */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
            Platform Verification Accuracy Trend (7-Day Ledger)
          </h3>
          <span className="text-xs font-mono text-[#0D9040]">
            Current Avg: {data.accuracyTrendSeries[data.accuracyTrendSeries.length - 1]?.accuracyPct}%
          </span>
        </div>

        <div className="flex h-36 items-end justify-between gap-2 pt-4">
          {data.accuracyTrendSeries.map((pt, idx) => {
            const hPct = Math.max(
              20,
              Math.min(100, Math.round((pt.accuracyPct / maxAcc) * 100)),
            );
            return (
              <div
                key={idx}
                className="flex flex-1 flex-col items-center justify-end space-y-1"
              >
                <div className="text-[10px] font-bold text-[#FAFAFA]">
                  {pt.accuracyPct}%
                </div>
                <div
                  className="w-full rounded-t bg-[#0D9040] transition-all hover:bg-[#0D9040]/80"
                  style={{ height: `${hPct}%` }}
                  title={`${pt.day}: ${pt.accuracyPct}% accuracy`}
                />
                <div className="text-[10px] text-[#A0A4A8]">{pt.day}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Version History Ledger */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <h3 className="mb-3 text-sm font-bold text-[#FAFAFA]">
          Recent Calibration &amp; Model Data Version History Ledger
        </h3>
        <div className="divide-y divide-[#2E2E32] rounded border border-[#2E2E32] bg-[#0A0A0B]">
          {data.modelHistory.map((h, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between gap-2 p-3 text-xs sm:flex-row sm:items-center"
            >
              <div>
                <span className="font-mono font-bold text-[#3399FF]">
                  {h.modelId} (v:{h.version})
                </span>{" "}
                <span className="font-semibold text-[#FAFAFA]">{h.changeType}</span>
              </div>
              <span className="text-[11px] text-[#A0A4A8]">
                {new Date(h.updatedAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FeedbackImpact;
