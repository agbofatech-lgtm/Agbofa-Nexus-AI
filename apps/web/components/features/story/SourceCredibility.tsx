import { AlertTriangle, CheckCircle2, CircleHelp } from "lucide-react";

import type { VerificationSource } from "@/types/story";

interface SourceCredibilityProps {
  source: VerificationSource;
}

const statusConfig = {
  supporting: { label: "Supporting", icon: CheckCircle2 },
  conflicting: { label: "Conflicting", icon: AlertTriangle },
  unverified: { label: "Under review", icon: CircleHelp },
} as const;

export function SourceCredibility({ source }: SourceCredibilityProps) {
  const config = statusConfig[source.status];
  const Icon = config.icon;

  return (
    <li className={`source-credibility source-credibility--${source.status}`}>
      <span className="source-credibility__status">
        <Icon size={15} />
      </span>
      <div className="source-credibility__copy">
        <strong>{source.name}</strong>
        <span>{source.details ?? config.label}</span>
      </div>
      <div
        className="source-credibility__score"
        title={`${source.credibility}% source credibility`}
      >
        <span>{source.credibility}%</span>
        <i>
          <b style={{ width: `${source.credibility}%` }} />
        </i>
      </div>
    </li>
  );
}
