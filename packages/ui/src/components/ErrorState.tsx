import React from "react";
import { Button } from "./Button";

export interface ErrorStateComponentProps {
  message: string;
  code?: string;
  onRetry?: () => void;
  className?: string;
  "data-testid"?: string;
}

export function ErrorState({
  message,
  code,
  onRetry,
  className = "",
  ...props
}: ErrorStateComponentProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-6 bg-red-50 border border-red-200 rounded-lg text-center ${className}`}
      {...props}
    >
      <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wide mb-1">
        {code ? `Error: ${code}` : "Error"}
      </div>
      <p className="text-sm font-medium text-[#0F172A] mb-4">{message}</p>
      {onRetry && (
        <Button variant="danger" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
