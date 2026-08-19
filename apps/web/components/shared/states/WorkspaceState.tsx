import {
  AlertTriangle,
  CheckCircle2,
  DatabaseZap,
  Inbox,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
export type WorkspaceStateKind =
  | "loading"
  | "success"
  | "empty"
  | "error"
  | "unavailable"
  | "simulated"
  | "degraded"
  | "pending"
  | "partial"
  | "requiresAuthorization"
  | "blocked";
export function WorkspaceState({
  state,
  title,
  message,
  onRetry,
}: {
  state: WorkspaceStateKind;
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  if (state === "loading")
    return (
      <div
        aria-label={title ?? "Loading workspace"}
        className="workspace-state-loading"
      >
        <Skeleton height={72} rounded="lg" />
        <div>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} height={150} rounded="lg" />
          ))}
        </div>
      </div>
    );
  const Icon =
    state === "error" || state === "degraded"
      ? AlertTriangle
      : state === "empty"
        ? Inbox
        : state === "blocked" || state === "requiresAuthorization"
          ? LockKeyhole
          : state === "simulated" || state === "partial"
            ? ShieldAlert
            : state === "success"
              ? CheckCircle2
              : DatabaseZap;
  const defaults: Record<Exclude<WorkspaceStateKind, "loading">, string> = {
    success: "Workspace ready",
    empty: "Nothing here yet",
    error: "Workspace unavailable",
    unavailable: "Integration unavailable",
    simulated: "Simulation active",
    degraded: "Data is degraded",
    pending: "Capability pending",
    partial: "Partial data available",
    requiresAuthorization: "Authorization required",
    blocked: "Capability blocked",
  };
  return (
    <section
      className={`workspace-state workspace-state--${state}`}
      role={state === "error" ? "alert" : "status"}
    >
      <span aria-hidden="true">
        <Icon size={22} />
      </span>
      <div>
        <strong>{title ?? defaults[state]}</strong>
        <p>{message ?? "No authoritative data is available for this state."}</p>
      </div>
      {onRetry ? (
        <Button onClick={onRetry} size="sm" variant="secondary">
          <RefreshCw size={13} /> Retry
        </Button>
      ) : null}
    </section>
  );
}
