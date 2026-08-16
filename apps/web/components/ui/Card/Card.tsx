import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface CardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "onClick"
> {
  variant?: "default" | "glass" | "interactive" | "feature";
  children: ReactNode;
  onClick?: () => void;
}

export function Card({
  variant = "default",
  children,
  className,
  onClick,
  ...props
}: CardProps) {
  const classes = cn("nexus-card", `nexus-card--${variant}`, className);

  if (onClick) {
    return (
      <button className={classes} onClick={onClick} type="button">
        {children}
      </button>
    );
  }

  return (
    <div {...props} className={classes}>
      {children}
    </div>
  );
}
