import React from "react";

export interface SkeletonComponentProps {
  className?: string;
  "data-testid"?: string;
}

export function Skeleton({
  className = "h-4 w-full",
  ...props
}: SkeletonComponentProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded ${className}`}
      {...props}
    />
  );
}
