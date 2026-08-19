import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface NavGroupProps {
  label: string;
  children: ReactNode;
  active?: boolean;
  collapsed?: boolean;
}

export function NavGroup({
  label,
  children,
  active = false,
  collapsed = false,
}: NavGroupProps) {
  return (
    <section
      className={cn(
        "nav-group",
        active && "nav-group--active-context",
        collapsed && "nav-group--collapsed",
      )}
    >
      <h2 className="nav-group__label">
        {collapsed ? <span aria-hidden="true" /> : label}
      </h2>
      <div className="nav-group__items">{children}</div>
    </section>
  );
}
