"use client";

import {
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Factory,
  Gauge,
  LayoutDashboard,
  Newspaper,
  Orbit,
  Settings2,
  Sparkles,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { NavGroup } from "@/components/shared/navigation/NavGroup";
import { NavItem } from "@/components/shared/navigation/NavItem";
import { cn } from "@/lib/utils/cn";

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavigationGroup {
  label: string;
  items: readonly NavigationItem[];
}

const navigation: readonly NavigationGroup[] = [
  {
    label: "Command",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Reader", href: "/reader", icon: BookOpen },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "AI Intelligence", href: "/intelligence", icon: BrainCircuit },
      { label: "Agents", href: "/agents", icon: Bot, badge: "12" },
      { label: "Predictions", href: "/predictions", icon: Orbit },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Newsroom", href: "/newsroom", icon: Newspaper },
      { label: "Content Factory", href: "/factory", icon: Factory },
      { label: "Truth Review", href: "/review", icon: Eye, badge: "4" },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Revenue", href: "/revenue", icon: TrendingUp },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Operations", href: "/operations", icon: Gauge },
      { label: "Administration", href: "/admin", icon: Users },
    ],
  },
];

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
  return (
    <>
      <button
        aria-label="Close navigation"
        className={cn("sidebar-scrim", mobileOpen && "sidebar-scrim--visible")}
        onClick={onMobileClose}
        type="button"
      />
      <aside
        aria-label="Primary navigation"
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

        <nav className="sidebar__navigation">
          {navigation.map((group) => (
            <NavGroup
              key={group.label}
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
            title={collapsed ? "Agbofa Media" : undefined}
          >
            <span aria-hidden="true" className="tenant-card__icon">
              <Building2 size={17} />
            </span>
            <span className="tenant-card__copy">
              <small>Tenant</small>
              <strong>Agbofa Media</strong>
            </span>
            <Settings2
              aria-hidden="true"
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
