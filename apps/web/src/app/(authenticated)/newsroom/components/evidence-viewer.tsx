"use client";

import React, { useState } from "react";
import { EvidenceItem } from "../types";

export interface EvidenceViewerProps {
  claimId: string;
  evidenceList: EvidenceItem[];
}

function getEvidenceBadge(type: "SUPPORTING" | "REFUTING" | "NEUTRAL"): {
  label: string;
  style: string;
} {
  switch (type) {
    case "SUPPORTING":
      return {
        label: "SUPPORTING",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/30",
      };
    case "REFUTING":
      return {
        label: "REFUTING",
        style: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/30",
      };
    case "NEUTRAL":
    default:
      return {
        label: "NEUTRAL",
        style: "bg-[#3399FF]/20 text-[#3399FF] border border-[#3399FF]/30",
      };
  }
}

export function EvidenceViewer({
  evidenceList,
}: EvidenceViewerProps): React.JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (evidenceList.length === 0) {
    return (
      <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-xs text-[#A0A4A8]">
        No supporting or refuting evidence linked to this claim.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A0A4A8]">
        Linked Evidence Ledger ({evidenceList.length} sources)
      </div>
      <div className="divide-y divide-[#2E2E32] rounded-md border border-[#2E2E32] bg-[#0A0A0B]">
        {evidenceList.map((item) => {
          const badge = getEvidenceBadge(item.type);
          const isExpanded = expandedId === item.evidenceId;
          return (
            <div key={item.evidenceId} className="p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.style}`}
                  >
                    {badge.label}
                  </span>
                  <span className="font-semibold text-[#FAFAFA]">
                    {item.source}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="rounded bg-[#12121A] px-2 py-0.5 text-[11px] font-medium text-[#0D9040]">
                    {(item.reliability * 100).toFixed(0)}% Reliability
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : item.evidenceId)
                    }
                    className="text-[11px] font-medium text-[#3399FF] hover:underline"
                  >
                    {isExpanded ? "Hide Details ↑" : "Details ↓"}
                  </button>
                </div>
              </div>

              <p className="mt-1.5 text-xs text-[#A0A4A8]">
                {item.description}
              </p>

              {isExpanded && (
                <div className="mt-2 rounded border border-[#2E2E32] bg-[#12121A] p-2.5 text-[11px] text-[#FAFAFA]">
                  <div className="font-semibold text-[#3399FF]">
                    Verification Audit Note:
                  </div>
                  <p className="mt-1 text-[#A0A4A8]">
                    Source reliability score {(item.reliability * 100).toFixed(0)}%
                    computed by AGT-019 Source Credibility Assessor. Cross-media consistency
                    verified by AGT-013-CROSS against wire feed database.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EvidenceViewer;
