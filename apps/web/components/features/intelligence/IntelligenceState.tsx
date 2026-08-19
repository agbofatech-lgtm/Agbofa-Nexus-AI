import { AlertTriangle, DatabaseZap, RefreshCw } from "lucide-react";

import { Button, Skeleton } from "@/components/ui";

interface IntelligenceStateProps {
  state: "loading" | "empty" | "error" | "unavailable";
  message?: string;
  onRetry?: () => void;
}

export function IntelligenceState({
  state,
  message,
  onRetry,
}: IntelligenceStateProps) {
  if (state === "loading")
    return (
      <div className="intelligence-loading" aria-label="Loading intelligence">
        <div>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} height={110} rounded="lg" />
          ))}
        </div>
        <Skeleton height={360} rounded="lg" />
        <Skeleton height={260} rounded="lg" />
      </div>
    );
  const error = state === "error";
  return (
    <section
      className={
        error
          ? "intelligence-state intelligence-state--error glass"
          : "intelligence-state glass"
      }
      role={error ? "alert" : "status"}
    >
      <span>
        {error ? <AlertTriangle size={22} /> : <DatabaseZap size={22} />}
      </span>
      <div>
        <strong>
          {error
            ? "Intelligence module unavailable."
            : state === "empty"
              ? "No intelligence data available."
              : "Backend integration unavailable."}
        </strong>
        <p>
          {message ?? "This screen remains stable while data is unavailable."}
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
