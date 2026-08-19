"use client";
import {
  BarChart3,
  Binoculars,
  LayoutDashboard,
  Radar,
  ScanSearch,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
const links = [
  { label: "Overview", href: "/growth", icon: LayoutDashboard },
  { label: "Opportunities", href: "/growth/opportunities", icon: Binoculars },
  { label: "Trends", href: "/growth/trends", icon: Radar },
  { label: "Content Gap", href: "/growth/content-gap", icon: ScanSearch },
  { label: "Audience", href: "/growth/audience", icon: Users },
  { label: "Competitors", href: "/growth/competitors", icon: BarChart3 },
] as const;
export function GrowthWorkspaceNav() {
  const path = usePathname();
  return (
    <nav aria-label="Growth Intelligence sections" className="growth-os-nav">
      {links.map((x) => {
        const I = x.icon;
        const active =
          path === x.href ||
          (x.href !== "/growth" && path.startsWith(`${x.href}/`));
        return (
          <Link
            key={x.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "growth-os-nav__item",
              active && "growth-os-nav__item--active",
            )}
            href={x.href}
          >
            <I size={15} />
            {x.label}
          </Link>
        );
      })}
    </nav>
  );
}
