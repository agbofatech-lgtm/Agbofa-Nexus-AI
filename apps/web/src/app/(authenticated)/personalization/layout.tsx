"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface PersonalizationLayoutProps {
  children: React.ReactNode;
}

export default function PersonalizationLayout({
  children,
}: PersonalizationLayoutProps): React.JSX.Element {
  const pathname = usePathname() || "";

  const navItems = [
    {
      label: "Overview",
      href: "/personalization",
      exact: true,
      badge: "4 Domains",
    },
    {
      label: "Profile & Preferences (PERS-001)",
      href: "/personalization/profile",
      badge: "8 Topics • 9 Sources",
    },
    {
      label: "Feed Settings (PERS-002)",
      href: "/personalization/feed",
      badge: "5-Factor Formula",
    },
    {
      label: "Insights (PERS-003/005)",
      href: "/personalization/insights",
      badge: "0.85 Diversity",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Personalization Top Title & Sub-navigation Bar */}
      <div className="border-b border-[#2E2E32]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-[#FAFAFA] md:text-2xl">
              Personalization Intelligence Workspace (IMP-019)
            </h1>
            <p className="text-xs text-[#A0A4A8]">
              Authoritative AI reader profile, multi-strategy feed curation, recommendation explanations, and behavioral analytics
            </p>
          </div>
          <div className="inline-flex items-center rounded-full bg-[#0066CC]/10 px-3 py-1 text-xs font-semibold text-[#3399FF] border border-[#0066CC]/30">
            ⚡ 5 Personalization Engines Active (PERS-001–005)
          </div>
        </div>

        {/* Horizontal scrollable sub-nav tabs */}
        <nav
          aria-label="Personalization sub-navigation"
          className="flex space-x-6 overflow-x-auto pb-1 text-xs font-semibold scrollbar-thin scrollbar-thumb-[#2E2E32]"
        >
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center space-x-2 pb-3 transition-colors ${
                  isActive
                    ? "border-b-2 border-[#0066CC] text-[#FAFAFA]"
                    : "text-[#A0A4A8] hover:text-[#FAFAFA]"
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-[#0066CC] text-white"
                        : "bg-[#12121A] text-[#A0A4A8] border border-[#2E2E32]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Render selected personalization workspace page */}
      {children}
    </div>
  );
}
