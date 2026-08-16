"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface NavItemProps {
  href: string;
  label: string;
  icon: ReactNode;
  collapsed?: boolean;
  onNavigate?: () => void;
  badge?: string;
}

export function NavItem({
  href,
  label,
  icon,
  collapsed = false,
  onNavigate,
  badge,
}: NavItemProps) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "nav-item",
        active && "nav-item--active",
        collapsed && "nav-item--collapsed",
      )}
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
    >
      <span aria-hidden="true" className="nav-item__icon">
        {icon}
      </span>
      <span className="nav-item__label">{label}</span>
      {badge && !collapsed ? (
        <span className="nav-item__badge">{badge}</span>
      ) : null}
    </Link>
  );
}
