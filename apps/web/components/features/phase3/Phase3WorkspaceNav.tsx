"use client";

import { BarChart3, FlaskConical, Send } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Distribution", href: "/distribution", icon: Send },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Experiments", href: "/experiments", icon: FlaskConical },
] as const;

export function Phase3WorkspaceNav() {
  const pathname = usePathname();
  return (
    <nav className="phase3-workspace-nav" aria-label="Phase 3 workspaces">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link aria-current={active ? "page" : undefined} href={item.href} key={item.href}>
            <Icon aria-hidden="true" size={14} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
