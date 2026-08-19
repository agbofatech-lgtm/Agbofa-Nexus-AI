import { CalendarClock, CircleOff, FlaskConical, Radio } from "lucide-react";
import type { StrategyExecutionReality } from "@/types/strategy-director";

const icons = {
  PLANNED: CalendarClock,
  SIMULATED: FlaskConical,
  UNAVAILABLE: CircleOff,
  ACTUAL: Radio,
} as const;

export function ExecutionRealityBadge({
  reality,
}: {
  reality: StrategyExecutionReality;
}) {
  const Icon = icons[reality];
  return (
    <span className={`execution-reality execution-reality--${reality.toLowerCase()}`}>
      <Icon aria-hidden="true" size={11} />
      {reality}
    </span>
  );
}
