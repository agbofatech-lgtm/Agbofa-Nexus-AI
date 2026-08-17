import { AlertTriangle, CheckCircle2, CircleHelp } from "lucide-react";

import type { TruthSource } from "@/types/truth";

interface SourceCredibilityProps {
  source: TruthSource;
}

const sourceIcons = {
  supporting: CheckCircle2,
  conflicting: AlertTriangle,
  unverified: CircleHelp,
} as const;

export function SourceCredibility({ source }: SourceCredibilityProps) {
  const Icon = sourceIcons[source.status];
  return (
    <li className={`truth-source truth-source--${source.status}`}>
      <span>
        <Icon size={14} />
      </span>
      <div>
        <strong>{source.name}</strong>
        <small>{source.details}</small>
      </div>
      <div>
        <b>{source.credibility}%</b>
        <i>
          <span style={{ width: `${source.credibility}%` }} />
        </i>
      </div>
    </li>
  );
}
