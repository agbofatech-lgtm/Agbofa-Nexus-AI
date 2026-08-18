"use client";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavGroup } from "@/components/shared/navigation/NavGroup";
import { NavItem } from "@/components/shared/navigation/NavItem";
import {
  getNavigationContext,
  getNavigationContextDetails,
  navigationGroups,
} from "@/components/shared/navigation/navigation";
import { cn } from "@/lib/utils/cn";

export interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onCollapseChange,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const activeContext = getNavigationContext(pathname);
  const context = getNavigationContextDetails(pathname);
  const ContextIcon = context.icon;

  return (
    <>
      <button
        aria-label="Close navigation"
        className={cn("sidebar-scrim", mobileOpen && "sidebar-scrim--visible")}
        onClick={onMobileClose}
        type="button"
      />
      <aside
        aria-label="Workspace navigation"
        className={cn(
          "sidebar",
          collapsed && "sidebar--collapsed",
          mobileOpen && "sidebar--mobile-open",
        )}
        id="workspace-navigation"
      >
        <div className="sidebar__brand">
          <Link
            aria-label="Agbofa Nexus AI command overview"
            className="brand-mark"
            href="/dashboard"
            onClick={onMobileClose}
          >
            <Sparkles size={19} strokeWidth={2.2} />
          </Link>
          <div className="sidebar__brand-copy">
            <strong>AGBOFA</strong>
            <span>NEXUS AI</span>
          </div>
          <button
            aria-label="Close navigation"
            className="sidebar__mobile-close icon-button"
            onClick={onMobileClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="sidebar__context"
          title={collapsed ? context.label : undefined}
        >
          <span aria-hidden="true">
            <ContextIcon size={18} />
          </span>
          <div>
            <small>Active workspace</small>
            <strong>{context.label}</strong>
            <p>{context.description}</p>
          </div>
        </div>

        <nav aria-label="Feature navigation" className="sidebar__navigation">
          {navigationGroups.map((group) => (
            <NavGroup
              key={group.context}
              active={activeContext === group.context}
              collapsed={collapsed}
              label={group.label}
            >
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavItem
                    key={item.href}
                    badge={item.badge}
                    collapsed={collapsed}
                    exact={item.exact}
                    href={item.href}
                    icon={<Icon size={18} strokeWidth={1.8} />}
                    label={item.label}
                    onNavigate={onMobileClose}
                  />
                );
              })}
            </NavGroup>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div
            className="tenant-card"
            title={collapsed ? "Demo workspace" : undefined}
          >
            <span aria-hidden="true" className="tenant-card__icon">
              <Building2 size={17} />
            </span>
            <span className="tenant-card__copy">
              <small>Frontend environment</small>
              <strong>Agbofa Media · Demo</strong>
            </span>
            <FlaskConical
              aria-label="Demo data"
              className="tenant-card__settings"
              size={15}
            />
          </div>
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="sidebar__collapse"
            onClick={() => onCollapseChange(!collapsed)}
            type="button"
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            <span>{collapsed ? "Expand" : "Collapse"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
