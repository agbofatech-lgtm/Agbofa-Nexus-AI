"use client";

import React from "react";
import { IngestionRoutingData } from "../types";

export interface IngestionMetricsProps {
  data: IngestionRoutingData;
}

export function IngestionMetrics({ data }: IngestionMetricsProps): React.JSX.Element {
  const totalTier = Math.max(
    data.tierCounts.verifiedTruth +
      data.tierCounts.provisional +
      data.tierCounts.doubtful,
    1,
  );
  const vtPct = Math.round((data.tierCounts.verifiedTruth / totalTier) * 100);
  const prPct = Math.round((data.tierCounts.provisional / totalTier) * 100);
  const dbPct = Math.round((data.tierCounts.doubtful / totalTier) * 100);

  return (
    <div className="space-y-6">
      {/* 1. Routing Breakdown by Confidence Tier */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
        <div className="mb-4 flex items-center justify-between border-b border-[#2E2E32] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              AGT-025 Authoritative Ingestion Routing by Confidence Tier ({totalTier.toLocaleString()} total)
            </h3>
            <p className="text-xs text-[#A0A4A8]">
              VERIFIED_TRUTH → Factory · PROVISIONAL → Review · DOUBTFUL → Verification Loop
            </p>
          </div>
          <span className="rounded-full bg-[#0066CC]/20 px-3 py-1 text-xs font-bold text-[#3399FF]">
            {totalTier.toLocaleString()} Routed (24h)
          </span>
        </div>

        {/* Proportional bar */}
        <div className="mb-6 flex h-7 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
          <div
            className="h-full bg-[#0D9040] transition-all"
            style={{ width: `${vtPct}%` }}
            title={`VERIFIED TRUTH (#0D9040): ${vtPct}%`}
          />
          <div
            className="h-full bg-[#3399FF] transition-all"
            style={{ width: `${prPct}%` }}
            title={`PROVISIONAL (#3399FF): ${prPct}%`}
          />
          <div
            className="h-full bg-[#CF2020] transition-all"
            style={{ width: `${dbPct}%` }}
            title={`DOUBTFUL (#CF2020): ${dbPct}%`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded border border-[#0D9040]/30 bg-[#0D9040]/10 p-4">
            <div className="text-xs font-bold text-[#0D9040]">
              VERIFIED TRUTH (≥ 0.85) — #0D9040
            </div>
            <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
              {data.tierCounts.verifiedTruth.toLocaleString()} ({vtPct}%)
            </div>
            <div className="mt-1 text-[11px] text-[#A0A4A8]">
              Direct route to Content Factory
            </div>
          </div>

          <div className="rounded border border-[#3399FF]/30 bg-[#3399FF]/10 p-4">
            <div className="text-xs font-bold text-[#3399FF]">
              PROVISIONAL (0.60–0.85) — #3399FF
            </div>
            <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
              {data.tierCounts.provisional.toLocaleString()} ({prPct}%)
            </div>
            <div className="mt-1 text-[11px] text-[#A0A4A8]">
              Routed to Editorial Review
            </div>
          </div>

          <div className="rounded border border-[#CF2020]/30 bg-[#CF2020]/10 p-4">
            <div className="text-xs font-bold text-[#CF2020]">
              DOUBTFUL (&lt; 0.60) — #CF2020
            </div>
            <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
              {data.tierCounts.doubtful.toLocaleString()} ({dbPct}%)
            </div>
            <div className="mt-1 text-[11px] text-[#A0A4A8]">
              Returned to Verification Loop
            </div>
          </div>
        </div>
      </div>

      {/* 2. Priority Distribution & Idempotency Stats (2 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Priority Distribution */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
          <h3 className="mb-3 text-sm font-bold text-[#FAFAFA]">
            Signal Priority Distribution (BREAKING / HIGH / STANDARD / LOW)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded border border-[#CF2020]/30 bg-[#CF2020]/10 p-3">
              <div className="text-xs font-bold text-[#CF2020]">
                BREAKING — #CF2020
              </div>
              <div className="mt-1 text-xl font-bold text-[#FAFAFA]">
                {data.priorityCounts.breaking.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#A0A4A8]">C1 Critical alerts</div>
            </div>

            <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="text-xs font-bold text-amber-400">
                HIGH — #F59E0B
              </div>
              <div className="mt-1 text-xl font-bold text-[#FAFAFA]">
                {data.priorityCounts.high.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#A0A4A8]">C2 Developing feeds</div>
            </div>

            <div className="rounded border border-[#0066CC]/30 bg-[#0066CC]/10 p-3">
              <div className="text-xs font-bold text-[#3399FF]">
                STANDARD — #3399FF
              </div>
              <div className="mt-1 text-xl font-bold text-[#FAFAFA]">
                {data.priorityCounts.standard.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#A0A4A8]">C3 Regular syndication</div>
            </div>

            <div className="rounded border border-[#2E2E32] bg-[#2E2E32]/40 p-3">
              <div className="text-xs font-bold text-[#A0A4A8]">
                LOW — #A0A4A8
              </div>
              <div className="mt-1 text-xl font-bold text-[#FAFAFA]">
                {data.priorityCounts.low.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#A0A4A8]">Background scraping</div>
            </div>
          </div>
        </div>

        {/* Ingestion Lifecycle & Idempotency Stats */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
          <h3 className="mb-3 text-sm font-bold text-[#FAFAFA]">
            Ingestion Lifecycle &amp; Idempotency Deduplication Ledger
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded bg-[#0A0A0B] p-2.5">
              <span className="text-[#A0A4A8]">RECEIVED → ROUTED:</span>
              <span className="font-bold text-[#FAFAFA]">
                {data.lifecycleCounts.received.toLocaleString()} / {data.lifecycleCounts.routed.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between rounded bg-[#0A0A0B] p-2.5">
              <span className="text-[#A0A4A8]">PROCESSING → DELIVERED:</span>
              <span className="font-bold text-[#0D9040]">
                {data.lifecycleCounts.processing.toLocaleString()} / {data.lifecycleCounts.delivered.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between rounded bg-[#0A0A0B] p-2.5">
              <span className="text-[#A0A4A8]">FAILED / DROPPED:</span>
              <span className="font-bold text-[#FAFAFA]">
                {data.lifecycleCounts.failed} items
              </span>
            </div>

            <div className="border-t border-[#2E2E32] pt-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-[#3399FF]">Deduplication Rate:</span>
                <span className="text-[#0D9040]">
                  {data.idempotency.successfullyDeduplicated} / {data.idempotency.duplicatesDetected} (100% skipped)
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[#A0A4A8]">
                Idempotency key index matching on payload SHA-256 hash.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IngestionMetrics;
