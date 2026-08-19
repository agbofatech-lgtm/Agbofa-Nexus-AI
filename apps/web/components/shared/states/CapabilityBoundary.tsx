import { LockKeyhole, ShieldAlert } from "lucide-react";
import { DomainStatusBadge } from "@/components/shared/states/DomainStatusBadge";
import type { CapabilityState, ExecutionReality } from "@/types/capabilities";
export function CapabilityBoundary({
  title,
  detail,
  dependency,
  state = "blocked",
  reality = "execution-unavailable",
}: {
  title: string;
  detail: string;
  dependency?: string;
  state?: CapabilityState;
  reality?: ExecutionReality;
}) {
  const simulated = reality === "simulation";
  return (
    <aside className="capability-boundary" role="note">
      <span aria-hidden="true">
        {simulated ? <ShieldAlert size={18} /> : <LockKeyhole size={18} />}
      </span>
      <div>
        <DomainStatusBadge status={state} />
        <strong>{title}</strong>
        <p>{detail}</p>
        <small>Reality: {reality.replaceAll("-", " ")}</small>
        {dependency ? <small>Requires: {dependency}</small> : null}
      </div>
    </aside>
  );
}
