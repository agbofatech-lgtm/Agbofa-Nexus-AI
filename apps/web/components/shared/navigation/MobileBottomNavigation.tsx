"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  isPrimaryNavigationActive,
  mobileNavigation,
} from "@/components/shared/navigation/navigation";
import { cn } from "@/lib/utils/cn";

interface MobileBottomNavigationProps {
  moreOpen: boolean;
  onOpenMore: () => void;
}

export function MobileBottomNavigation({
  moreOpen,
  onOpenMore,
}: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const anyPrimaryActive = mobileNavigation.some((item) =>
    isPrimaryNavigationActive(pathname, item),
  );

  return (
    <nav aria-label="Mobile workspaces" className="mobile-bottom-navigation">
      {mobileNavigation.map((item) => {
        const Icon = item.icon;
        const active = isPrimaryNavigationActive(pathname, item);
        return (
          <Link
            key={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "mobile-bottom-navigation__item",
              active && "mobile-bottom-navigation__item--active",
            )}
            href={item.href}
          >
            <Icon aria-hidden="true" size={19} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <button
        aria-controls="workspace-navigation"
        aria-expanded={moreOpen}
        aria-label="Open all workspaces"
        className={cn(
          "mobile-bottom-navigation__item",
          !anyPrimaryActive && "mobile-bottom-navigation__item--active",
        )}
        onClick={onOpenMore}
        type="button"
      >
        <Menu aria-hidden="true" size={19} />
        <span>More</span>
      </button>
    </nav>
  );
}
