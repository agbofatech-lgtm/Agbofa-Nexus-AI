"use client";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Sparkles,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { NavGroup } from "@/components/shared/navigation/NavGroup";
import { NavItem } from "@/components/shared/navigation/NavItem";
import {
  getNavigationGroup,
  primaryNavigation,
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
  const activeGroup = getNavigationGroup(pathname);
  const ContextIcon = activeGroup.items[0]?.icon ?? Sparkles;

  return (
    <>
      <button
        aria-label="Close navigation"
        className={cn("sidebar-scrim", mobileOpen && "sidebar-scrim--visible")}
        onClick={onMobileClose}
        type="button"
      />
      <aside
        aria-label={`${activeGroup.label} contextual navigation`}
        className={cn(
          "sidebar",
          collapsed && "sidebar--collapsed",
          mobileOpen && "sidebar--mobile-open",
        )}
      >
        <div className="sidebar__brand">
          <div aria-hidden="true" className="brand-mark">
            <Sparkles size={19} strokeWidth={2.2} />
          </div>
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

        <div className="sidebar__context" title={collapsed ? activeGroup.label : undefined}>
          <span aria-hidden="true">
            <ContextIcon size={18} />
          </span>
          <div>
            <small>Active workspace</small>
            <strong>{activeGroup.label}</strong>
            <p>{activeGroup.description}</p>
          </div>
        </div>

        <nav className="sidebar__navigation">
          <NavGroup collapsed={collapsed} label={activeGroup.label}>
            {activeGroup.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavItem
                  key={item.href}
                  badge={item.badge}
                  collapsed={collapsed}
                  href={item.href}
                  icon={<Icon size={18} strokeWidth={1.8} />}
                  label={item.label}
                  onNavigate={onMobileClose}
                />
              );
            })}
          </NavGroup>

          <div className="sidebar__workspace-switcher">
            <NavGroup collapsed={collapsed} label="Switch workspace">
              {primaryNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavItem
                    key={item.href}
                    collapsed={collapsed}
                    href={item.href}
                    icon={<Icon size={17} strokeWidth={1.8} />}
                    label={item.label}
                    onNavigate={onMobileClose}
                  />
                );
              })}
            </NavGroup>
          </div>
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
