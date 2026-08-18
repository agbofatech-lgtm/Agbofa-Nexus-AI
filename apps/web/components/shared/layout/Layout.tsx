"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Header } from "@/components/shared/layout/Header";
import { Sidebar } from "@/components/shared/layout/Sidebar";
import { WorkspaceContextBar } from "@/components/shared/layout/WorkspaceContextBar";
import { MobileBottomNavigation } from "@/components/shared/navigation/MobileBottomNavigation";
import { cn } from "@/lib/utils/cn";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavigationOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavigationOpen]);

  const openNavigation = () => setMobileNavigationOpen(true);
  const closeNavigation = () => setMobileNavigationOpen(false);

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
        onMobileClose={closeNavigation}
      />
      <div className="app-shell__workspace">
        <Header onOpenNavigation={openNavigation} />
        <WorkspaceContextBar />
        <main className="app-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
        <MobileBottomNavigation onOpenMore={openNavigation} />
      </div>
    </div>
  );
}
