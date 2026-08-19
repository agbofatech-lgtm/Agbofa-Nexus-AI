import { ShieldCheck } from "lucide-react";

interface ConfidenceVisualizationProps {
  score: number;
  compact?: boolean;
}

function level(score: number): string {
  if (score >= 90) return "Very high";
  if (score >= 75) return "High";
  if (score >= 50) return "Moderate";
  return "Low";
}

export function ConfidenceVisualization({
  score,
  compact = false,
}: ConfidenceVisualizationProps) {
  const normalized = Math.min(100, Math.max(0, Math.round(score)));
  return (
    <div
      className={
        compact
          ? "truth-confidence truth-confidence--compact"
          : "truth-confidence"
      }
    >
      <div>
        <span>
          <ShieldCheck size={13} /> Confidence
        </span>
        <strong>
          {normalized}% <small>{level(normalized)}</small>
        </strong>
      </div>
      <i
        aria-label={`${normalized}% confidence, ${level(normalized)}`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={normalized}
        role="progressbar"
      >
        <b style={{ width: `${normalized}%` }} />
      </i>
    </div>
  );
}
