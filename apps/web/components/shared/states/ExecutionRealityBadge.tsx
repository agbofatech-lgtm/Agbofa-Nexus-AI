import { CalendarClock, CircleOff, FlaskConical, Gauge, Radio, Sparkles } from "lucide-react";
import type { ExecutiveReality } from "@/types/executive-command";
import type { StrategyExecutionReality } from "@/types/strategy-director";

const icons: Record<string, typeof FlaskConical> = {
  PLANNED: CalendarClock,
  SIMULATED: FlaskConical,
  ESTIMATED: Gauge,
  UNAVAILABLE: CircleOff,
  ACTUAL: Radio,
  PROJECTED: Sparkles,
  PENDING: CalendarClock,
  NOT_CONNECTED: CircleOff,
  DEGRADED: CircleOff,
  RECOMMENDATION: Sparkles,
  FIXTURE: FlaskConical,
};

export function ExecutionRealityBadge({
  reality,
}: {
  reality: ExecutiveReality | StrategyExecutionReality;
}) {
  const Icon = icons[reality] ?? CircleOff;
  return (
    <span className={`execution-reality execution-reality--${reality.toLowerCase()}`}>
      <Icon aria-hidden="true" size={11} />
      {reality}
    </span>
  );
}
