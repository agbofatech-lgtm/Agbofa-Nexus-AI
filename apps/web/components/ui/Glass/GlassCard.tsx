import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "default" | "dark" | "gold";
  interactive?: boolean;
  children: ReactNode;
}

export function GlassCard({
  tone = "default",
  interactive = false,
  children,
  className,
  ...props
}: GlassCardProps) {
  return (
    <div
      {...props}
      className={cn(
        tone === "default" ? "glass" : `glass-${tone}`,
        "glass-card",
        "glass-card-shell",
        interactive && "glass-card-shell--interactive",
        className,
      )}
    >
      {children}
    </div>
  );
}
