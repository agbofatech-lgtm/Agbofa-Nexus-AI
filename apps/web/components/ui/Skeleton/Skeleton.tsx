import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  rounded?: "sm" | "md" | "lg" | "full";
}

export function Skeleton({
  width = "100%",
  height = "1rem",
  rounded = "md",
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn("nexus-skeleton", `nexus-skeleton--${rounded}`, className)}
      style={{ ...style, width, height }}
    />
  );
}
