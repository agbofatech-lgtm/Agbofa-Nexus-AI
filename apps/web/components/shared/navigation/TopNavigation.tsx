"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getNavigationContext,
  primaryNavigation,
} from "@/components/shared/navigation/navigation";
import { cn } from "@/lib/utils/cn";

export function TopNavigation() {
  const pathname = usePathname();
  const activeContext = getNavigationContext(pathname);

  return (
    <nav aria-label="Primary workspaces" className="top-navigation">
      {primaryNavigation.map((item) => {
        const Icon = item.icon;
        const active = activeContext === item.context;
        return (
          <Link
            key={item.href}
            aria-current={active ? "page" : undefined}
            className={cn("top-navigation__item", active && "top-navigation__item--active")}
            href={item.href}
          >
            <Icon aria-hidden="true" size={15} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
