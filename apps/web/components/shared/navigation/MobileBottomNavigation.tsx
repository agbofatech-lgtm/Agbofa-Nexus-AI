"use client";

import {
  BookOpen,
  BrainCircuit,
  LayoutDashboard,
  Menu,
  Newspaper,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getNavigationContext,
  isNavigationItemActive,
} from "@/components/shared/navigation/navigation";
import { cn } from "@/lib/utils/cn";

interface MobileBottomNavigationProps {
  onOpenMore: () => void;
}

const destinations = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard, context: "command" },
  { label: "Reader", href: "/reader", icon: BookOpen, context: "reader" },
  {
    label: "Intelligence",
    href: "/ai-control",
    icon: BrainCircuit,
    context: "intelligence",
  },
  { label: "Newsroom", href: "/newsroom", icon: Newspaper, context: "newsroom" },
] as const;

export function MobileBottomNavigation({
  onOpenMore,
}: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const activeContext = getNavigationContext(pathname);
  const moreActive = ["distribution", "analytics", "settings"].includes(
    activeContext,
  );

  return (
    <nav aria-label="Mobile workspaces" className="mobile-bottom-navigation">
      {destinations.map((item) => {
        const Icon = item.icon;
        const active =
          item.context === "command"
            ? isNavigationItemActive(pathname, item.href)
            : activeContext === item.context;
        return (
          <Link
            key={item.href}
            aria-current={active ? "page" : undefined}
            className={cn("mobile-bottom-navigation__item", active && "mobile-bottom-navigation__item--active")}
            href={item.href}
          >
            <Icon aria-hidden="true" size={19} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <button
        aria-label="Open all workspaces"
        className={cn(
          "mobile-bottom-navigation__item",
          moreActive && "mobile-bottom-navigation__item--active",
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
