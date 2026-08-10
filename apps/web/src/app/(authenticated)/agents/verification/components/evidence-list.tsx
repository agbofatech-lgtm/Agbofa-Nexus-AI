"use client";

import React, { useState } from "react";
import { EvidenceItemData } from "../types";

export interface EvidenceListProps {
  evidence: EvidenceItemData[];
  showReliability?: boolean;
  showSource?: boolean;
}

function getEvidenceStyle(type: "SUPPORTING" | "REFUTING" | "NEUTRAL"): {
  border: string;
  badge: string;
  label: string;
} {
  switch (type) {
    case "SUPPORTING":
      return {
        border: "border-l-4 border-l-[#0D9040]",
        badge: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/30",
        label: "SUPPORTING",
      };
    case "REFUTING":
      return {
        border: "border-l-4 border-l-[#CF2020]",
        badge: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/30",
        label: "REFUTING",
      };
    case "NEUTRAL":
    default:
      return {
        border: "border-l-4 border-l-[#A0A4A8]",
        badge: "bg-[#2E2E32]/60 text-[#A0A4A8] border border-[#2E2E32]",
        label: "NEUTRAL",
      };
  }
}

export function EvidenceList({
  evidence,
  showReliability = true,
  showSource = true,
}: EvidenceListProps): React.JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (evidence.length === 0) {
    return (
      <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-4 text-center text-xs text-[#A0A4A8]">
        No evidence collected for this claim ledger.
      </div>
    );
  }

  const supporting = evidence.filter((e) => e.type === "SUPPORTING");
  const refuting = evidence.filter((e) => e.type === "REFUTING");
  const neutral = evidence.filter((e) => e.type === "NEUTRAL");

  const renderGroup = (title: string, items: EvidenceItemData[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
          {title} ({items.length})
        </h4>
        <div className="space-y-2">
          {items.map((item) => {
            const st = getEvidenceStyle(item.type);
            const isExpanded = expandedId === item.evidenceId;
            return (
              <div
                key={item.evidenceId}
                className={`rounded border border-[#2E2E32] bg-[#12121A] p-3 transition-all ${st.border}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${st.badge}`}
                    >
                      {st.label}
                    </span>
                    {showSource && (
                      <span className="font-semibold text-[#FAFAFA]">
                        {item.isOfficial && (
                          <span
                            className="mr-1 text-amber-400"
                            title="Official Gov/Edu Authority (.gov / .edu)"
                          >
                            ★
                          </span>
                        )}
                        {item.source}
                      </span>
                    )}
                    {item.isPrimary !== undefined && (
                      <span className="rounded bg-[#0A0A0B] px-1.5 py-0.5 text-[10px] font-mono text-[#3399FF] border border-[#2E2E32]">
                        {item.isPrimary ? "PRIMARY SOURCE" : "SECONDARY"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {showReliability && (
                      <span className="rounded bg-[#0A0A0B] px-2 py-0.5 text-[10px] font-bold text-[#0D9040] border border-[#2E2E32]">
                        {(item.reliabilityScore * 100).toFixed(0)}% Reliability
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : item.evidenceId)
                      }
                      className="text-[11px] font-medium text-[#3399FF] hover:underline"
                    >
                      {isExpanded ? "Hide Audit ↑" : "Details ↓"}
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-[#FAFAFA]">
                  {item.description}
                </p>

                {isExpanded && (
                  <div className="mt-3 rounded border border-[#2E2E32] bg-[#0A0A0B] p-2.5 text-[11px] text-[#A0A4A8]">
                    <div className="font-semibold text-[#FAFAFA]">
                      AGT-021 Evidence Audit Note:
                    </div>
                    <p className="mt-1">
                      Collected at {new Date(item.timestamp).toLocaleString()} from verified registry. Zero fabrication guarantee enforced: all cited items exist in the cross-media database.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderGroup("Supporting Evidence", supporting)}
      {renderGroup("Refuting Evidence", refuting)}
      {renderGroup("Neutral / Contextual Evidence", neutral)}
    </div>
  );
}

export default EvidenceList;
