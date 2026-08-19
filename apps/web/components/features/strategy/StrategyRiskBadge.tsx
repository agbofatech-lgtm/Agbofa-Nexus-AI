import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { StrategyRisk } from "@/types/strategy-director";

const icons = {
  LOW: ShieldCheck,
  MEDIUM: ShieldAlert,
  HIGH: AlertTriangle,
} as const;

export function StrategyRiskBadge({ risk }: { risk: StrategyRisk }) {
  const Icon = icons[risk.level];
  return (
    <span
      aria-label={`${risk.level} simulated risk. ${risk.rationale}`}
      className={`strategy-risk strategy-risk--${risk.level.toLowerCase()}`}
      title={risk.rationale}
    >
      <Icon aria-hidden="true" size={11} />
      {risk.level} RISK
    </span>
  );
}
