"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "../brand/logo";
import { useTheme } from "../theme/theme-provider";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
}

export function Sidebar({ isOpen, onClose, collapsed = false }: SidebarProps): React.JSX.Element {
  const pathname = usePathname() || "/";
  const { theme } = useTheme();

  const navItems = [
    { id: "nav-home", label: "Overview", href: "/", icon: "🏠" },
    { id: "nav-reader", label: "Reader / AI Workspace", href: "/reader", icon: "📰" },
  ];

  const sidebarWidth = collapsed ? "w-16" : "w-64";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#2E2E32] bg-[#0A0A0B] transition-all duration-300 md:static ${sidebarWidth} ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        aria-label="Sidebar navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-[#2E2E32] px-4">
          <Logo compact={collapsed} theme={theme} />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#A0A4A8] hover:text-[#FAFAFA] md:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  if (isOpen) onClose();
                }}
                className={`flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#1E40AF]/30 text-[#3399FF] border-l-2 border-[#3399FF]"
                    : "text-[#A0A4A8] hover:bg-[#12121A] hover:text-[#FAFAFA]"
                }`}
              >
                <span className="mr-3 text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#2E2E32] p-4 text-xs text-[#A0A4A8]">
          {!collapsed ? (
            <div>
              <p className="font-semibold text-[#FAFAFA]">Agbofa Nexus AI</p>
              <p>v1.0.0-phase2</p>
            </div>
          ) : (
            <p className="text-center font-bold">N</p>
          )}
        </div>
      </aside>
    </>
  );
}
