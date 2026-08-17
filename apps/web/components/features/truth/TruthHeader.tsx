"use client";

import { Scale, ShieldCheck } from "lucide-react";

import { useTruthStore } from "@/stores/truth-store";
import type { Claim, ClaimStatus } from "@/types/truth";

const statuses: Array<ClaimStatus | "all"> = [
  "all",
  "pending",
  "in-review",
  "verified",
  "disputed",
];

interface TruthHeaderProps {
  claims: Claim[];
}

export function TruthHeader({ claims }: TruthHeaderProps) {
  const active = useTruthStore((state) => state.statusFilter);
  const setStatus = useTruthStore((state) => state.setStatusFilter);

  return (
    <header className="truth-header">
      <div>
        <span className="truth-header__eyebrow">
          <Scale size={13} /> Evidence investigation
        </span>
        <h1>
          Truth Engine<span>.</span>
        </h1>
        <p>
          Inspect claims, sources, contradictions, and confidence—without hiding
          uncertainty.
        </p>
      </div>
      <div className="truth-header__health">
        <ShieldCheck size={17} />
        <span>
          <strong>
            {claims.filter((claim) => claim.status === "verified").length}
          </strong>{" "}
          verified claims
        </span>
      </div>
      <div
        className="truth-status-tabs"
        role="tablist"
        aria-label="Claim status filter"
      >
        {statuses.map((status) => (
          <button
            key={status}
            aria-selected={active === status}
            onClick={() => setStatus(status)}
            role="tab"
            type="button"
          >
            <span />
            {status}
            <b>
              {status === "all"
                ? claims.length
                : claims.filter((claim) => claim.status === status).length}
            </b>
          </button>
        ))}
      </div>
    </header>
  );
}
