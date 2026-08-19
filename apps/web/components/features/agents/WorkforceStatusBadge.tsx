import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  LoaderCircle,
  ShieldX,
} from "lucide-react";
import type { WorkforceStatus } from "@/types/strategy-director";

const icons = {
  IDLE: Circle,
  WORKING: LoaderCircle,
  BLOCKED: ShieldX,
  WAITING_APPROVAL: Clock3,
  COMPLETED: CheckCircle2,
  FAILED: AlertTriangle,
} as const;

export function WorkforceStatusBadge({ status }: { status: WorkforceStatus }) {
  const Icon = icons[status];
  return (
    <span className={`workforce-status workforce-status--${status.toLowerCase()}`}>
      <Icon aria-hidden="true" size={11} />
      {status.replaceAll("_", " ")}
    </span>
  );
}
