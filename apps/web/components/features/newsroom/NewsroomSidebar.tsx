"use client";

import {
  ClipboardCheck,
  Factory,
  LayoutDashboard,
  Radar,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const newsroomLinks = [
  { label: "Overview", href: "/newsroom", icon: LayoutDashboard },
  { label: "Origination", href: "/newsroom/origination", icon: Radar },
  { label: "Factory", href: "/newsroom/factory", icon: Factory },
  { label: "Review", href: "/newsroom/review", icon: ClipboardCheck },
  { label: "Truth", href: "/truth", icon: Scale },
] as const;

export function NewsroomSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Newsroom workspaces" className="newsroom-subnav glass">
      {newsroomLinks.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/newsroom" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "newsroom-subnav__item newsroom-subnav__item--active"
                : "newsroom-subnav__item"
            }
            href={item.href}
          >
            <Icon size={15} /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
