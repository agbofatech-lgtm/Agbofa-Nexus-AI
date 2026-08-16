import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface NavGroupProps {
  label: string;
  children: ReactNode;
  collapsed?: boolean;
}

export function NavGroup({
  label,
  children,
  collapsed = false,
}: NavGroupProps) {
  return (
    <section className={cn("nav-group", collapsed && "nav-group--collapsed")}>
      <h2 className="nav-group__label">
        {collapsed ? <span aria-hidden="true" /> : label}
      </h2>
      <div className="nav-group__items">{children}</div>
    </section>
  );
}
