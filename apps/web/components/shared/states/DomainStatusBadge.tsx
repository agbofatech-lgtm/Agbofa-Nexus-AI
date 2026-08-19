import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CapabilityState } from "@/types/capabilities";
export type DomainStatus =
  | CapabilityState
  | "success"
  | "empty"
  | "error"
  | "degraded"
  | "pending"
  | "partial"
  | "draft"
  | "review"
  | "approved"
  | "completed"
  | "failed";
const positive = new Set<DomainStatus>([
  "available",
  "success",
  "approved",
  "completed",
]);
const caution = new Set<DomainStatus>([
  "pending",
  "partial",
  "review",
  "degraded",
  "requiresAuthorization",
]);
const negative = new Set<DomainStatus>(["error", "failed"]);
export function DomainStatusBadge({
  status,
  label,
}: {
  status: DomainStatus;
  label?: string;
}) {
  const Icon =
    status === "blocked" || status === "unavailable"
      ? LockKeyhole
      : status === "simulated"
        ? ShieldAlert
        : positive.has(status)
          ? CheckCircle2
          : negative.has(status) || caution.has(status)
            ? AlertTriangle
            : status === "pending" || status === "comingSoon"
              ? Clock3
              : Circle;
  return (
    <span
      className={cn(
        "domain-status",
        positive.has(status) && "domain-status--positive",
        caution.has(status) && "domain-status--caution",
        negative.has(status) && "domain-status--negative",
        (status === "blocked" || status === "unavailable") &&
          "domain-status--unavailable",
      )}
    >
      <Icon aria-hidden="true" size={12} />
      {label ??
        status
          .replaceAll(/([A-Z])/g, " $1")
          .replaceAll("-", " ")
          .trim()}
    </span>
  );
}
