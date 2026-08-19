import {
  CircleHelp,
  DatabaseZap,
  Eye,
  FlaskConical,
  Gauge,
  GitBranch,
} from "lucide-react";
import type { TruthState } from "@/types/phase3-experience";

const icons = {
  OBSERVED: Eye,
  ESTIMATED: Gauge,
  ATTRIBUTED: GitBranch,
  FORECAST: CircleHelp,
  SIMULATED: FlaskConical,
  UNAVAILABLE: DatabaseZap,
} as const;

export function TruthStateBadge({ state }: { state: TruthState }) {
  const Icon = icons[state];
  return (
    <span className={`truth-state truth-state--${state.toLowerCase()}`}>
      <Icon aria-hidden="true" size={11} />
      {state}
    </span>
  );
}
