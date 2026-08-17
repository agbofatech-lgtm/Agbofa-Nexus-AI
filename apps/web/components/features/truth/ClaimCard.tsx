import { AlertTriangle, CheckCircle2, Circle, Clock3 } from "lucide-react";

import { ConfidenceVisualization } from "@/components/features/truth/ConfidenceVisualization";
import { formatRelativeTime } from "@/lib/utils/reader";
import type { Claim } from "@/types/truth";

interface ClaimCardProps {
  claim: Claim;
  selected: boolean;
  onSelect: (id: string) => void;
}

const statusIcons = {
  verified: CheckCircle2,
  "in-review": Clock3,
  pending: Circle,
  disputed: AlertTriangle,
} as const;

export function ClaimCard({ claim, selected, onSelect }: ClaimCardProps) {
  const Icon = statusIcons[claim.status];
  return (
    <button
      aria-pressed={selected}
      className={
        selected
          ? `claim-card claim-card--${claim.status} claim-card--selected`
          : `claim-card claim-card--${claim.status}`
      }
      onClick={() => onSelect(claim.id)}
      type="button"
    >
      <div className="claim-card__heading">
        <span>
          <Icon size={14} />
        </span>
        <small>{claim.status}</small>
        <time dateTime={claim.updatedAt.toISOString()}>
          {formatRelativeTime(claim.updatedAt)}
        </time>
      </div>
      <strong>{claim.claim}</strong>
      <p>{claim.context}</p>
      <ConfidenceVisualization compact score={claim.confidence} />
      <div className="claim-card__footer">
        <span>{claim.sources.length} sources</span>
        <span>
          {claim.evidence.supporting +
            claim.evidence.conflicting +
            claim.evidence.unverified}{" "}
          evidence items
        </span>
      </div>
    </button>
  );
}
