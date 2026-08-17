import React from "react";
import { Button } from "./Button";

export interface EmptyStateComponentProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  "data-testid"?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className = "",
  ...props
}: EmptyStateComponentProps) {
  return (
    <div
      className={`p-8 text-center bg-[#FFFFFF] border border-dashed border-slate-300 rounded-lg ${className}`}
      {...props}
    >
      <h3 className="text-base font-semibold text-[#0F172A] mb-1">{title}</h3>
      <p className="text-xs text-[#64748B] max-w-md mx-auto mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
