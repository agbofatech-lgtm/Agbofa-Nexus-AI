"use client";

import { useState, type ReactNode } from "react";

import { Header } from "@/components/shared/layout/Header";
import { Sidebar } from "@/components/shared/layout/Sidebar";
import { cn } from "@/lib/utils/cn";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div
      className={cn(
        "app-shell",
        sidebarCollapsed && "app-shell--sidebar-collapsed",
      )}
    >
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileNavigationOpen}
        onCollapseChange={setSidebarCollapsed}
        onMobileClose={() => setMobileNavigationOpen(false)}
      />
      <div className="app-shell__workspace">
        <Header onOpenNavigation={() => setMobileNavigationOpen(true)} />
        <main className="app-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
