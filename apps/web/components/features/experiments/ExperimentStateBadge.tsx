import { Archive, CirclePause, Clock3, FlaskConical, ShieldX, Trophy } from "lucide-react";
import type { ExperimentState } from "@/types/phase3-experience";

const icons = {
  DRAFT: FlaskConical,
  ACTIVE: Clock3,
  COMPLETED: Trophy,
  FAILED: ShieldX,
  PAUSED: CirclePause,
  ARCHIVED: Archive,
} as const;

export function ExperimentStateBadge({ state }: { state: ExperimentState }) {
  const Icon = icons[state];
  return <span className={`experiment-state experiment-state--${state.toLowerCase()}`}><Icon aria-hidden="true" size={11} />{state}</span>;
}
