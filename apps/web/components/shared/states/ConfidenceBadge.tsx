import { ShieldCheck } from "lucide-react";
import type { DataConfidence } from "@/types/data-state";
export function ConfidenceBadge({
  confidence,
  compact = false,
}: {
  confidence: DataConfidence;
  compact?: boolean;
}) {
  const score = Math.min(100, Math.max(0, Math.round(confidence.score)));
  const band = score >= 80 ? "high" : score >= 50 ? "medium" : "low";
  return (
    <span
      aria-label={`${score}% ${confidence.kind} confidence. ${confidence.basis}`}
      className={`confidence-badge confidence-badge--${band}`}
      title={confidence.basis}
    >
      <ShieldCheck aria-hidden="true" size={12} />
      <strong>{score}%</strong>
      {!compact ? <span>{confidence.kind} confidence</span> : null}
    </span>
  );
}
