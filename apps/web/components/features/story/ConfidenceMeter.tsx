import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export interface ConfidenceMeterProps {
  score: number;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
  showLevel?: boolean;
  className?: string;
}

function confidenceLevel(score: number) {
  if (score >= 90) return { key: "very-high", label: "Very High" } as const;
  if (score >= 75) return { key: "high", label: "High" } as const;
  if (score >= 50) return { key: "moderate", label: "Moderate" } as const;
  return { key: "low", label: "Low" } as const;
}

export function ConfidenceMeter({
  score,
  size = "medium",
  showLabel = true,
  showLevel = true,
  className,
}: ConfidenceMeterProps) {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));
  const level = confidenceLevel(normalizedScore);
  const explanation = `${normalizedScore}% confidence, ${level.label.toLowerCase()} evidence alignment.`;

  return (
    <div
      className={cn(
        "story-confidence",
        `story-confidence--${size}`,
        `story-confidence--${level.key}`,
        className,
      )}
      title={explanation}
    >
      {showLabel ? (
        <div className="story-confidence__heading">
          <span>
            <ShieldCheck size={14} /> Confidence
          </span>
          <span>
            <strong>{normalizedScore}%</strong>
            {showLevel ? <small>{level.label}</small> : null}
          </span>
        </div>
      ) : null}
      <div
        aria-label={explanation}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={normalizedScore}
        className="story-confidence__track"
        role="progressbar"
      >
        <span style={{ width: `${normalizedScore}%` }} />
      </div>
    </div>
  );
}
