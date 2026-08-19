import { AlertTriangle, DatabaseZap, RefreshCw } from "lucide-react";

import { Button, Skeleton } from "@/components/ui";
import type { DataAuthorityState } from "@/types/data-state";

export function BusinessState({
  state,
  message,
  onRetry,
}: {
  state: DataAuthorityState;
  message?: string;
  onRetry?: () => void;
}) {
  if (state === "loading")
    return (
      <div className="business-loading">
        <div>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} height={110} rounded="lg" />
          ))}
        </div>
        <Skeleton height={350} rounded="lg" />
        <Skeleton height={260} rounded="lg" />
      </div>
    );
  return (
    <section
      className={
        state === "error"
          ? "business-state business-state--error glass"
          : "business-state glass"
      }
      role={state === "error" ? "alert" : "status"}
    >
      <span>
        {state === "error" ? (
          <AlertTriangle size={22} />
        ) : (
          <DatabaseZap size={22} />
        )}
      </span>
      <div>
        <strong>
          {state === "error"
            ? "Data error"
            : state === "empty"
              ? "No data yet"
              : "Backend integration required"}
        </strong>
        <p>
          {message ??
            "This frontend remains stable while authoritative data is unavailable."}
        </p>
      </div>
      {onRetry ? (
        <Button onClick={onRetry} size="sm">
          <RefreshCw size={13} /> Retry
        </Button>
      ) : null}
    </section>
  );
}
