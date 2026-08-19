"use client";
import {
  BarChart3,
  Binoculars,
  BrainCircuit,
  GanttChart,
  LayoutDashboard,
  Radar,
  Scale,
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
  { label: "Strategy", href: "/growth/strategy", icon: BrainCircuit },
  { label: "Decisions", href: "/growth/decisions", icon: Scale },
  { label: "Timeline", href: "/growth/strategy/timeline", icon: GanttChart },
] as const;
export function GrowthWorkspaceNav() {
  const path = usePathname();
  const activeHref = [...links]
    .filter((item) => path === item.href || path.startsWith(`${item.href}/`))
    .sort((first, second) => second.href.length - first.href.length)[0]?.href;
  return (
    <nav aria-label="Growth Intelligence sections" className="growth-os-nav">
      {links.map((x) => {
        const I = x.icon;
        const active = x.href === activeHref;
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
