"use client";

import React from "react";
import { Logo } from "../brand/logo";
import { useTheme } from "../theme/theme-provider";
import { useSession } from "../auth/session-provider";
import { AuthoritativeBrandIdentity } from "@agbofa/config";

export interface HeaderProps {
  onToggleMobileMenu?: () => void;
  tenantName?: string;
  userEmail?: string;
}

export function Header({
  onToggleMobileMenu,
  tenantName = "Default Tenant",
  userEmail = "user@agbofa.com",
}: HeaderProps): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const { session, logout, status } = useSession();

  const displayTenant = session?.tenant_id || tenantName;
  const displayUser = session?.subject || userEmail;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#2E2E32] bg-[#0A0A0B]/90 px-4 backdrop-blur md:px-6">
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="inline-flex items-center justify-center rounded-md p-2 text-[#FAFAFA] hover:bg-[#12121A] focus:outline-none md:hidden"
          aria-label="Toggle mobile menu"
        >
          <span className="text-xl">☰</span>
        </button>
        <div className="md:hidden">
          <Logo compact={true} theme={theme} />
        </div>
        <div className="hidden md:block">
          <Logo compact={false} theme={theme} />
        </div>
        <span className="hidden text-xs font-medium uppercase tracking-wider text-[#A0A4A8] lg:inline-block">
          {AuthoritativeBrandIdentity.tagline}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden rounded-full border border-[#2E2E32] bg-[#12121A] px-3 py-1 text-xs font-semibold text-[#3399FF] sm:flex sm:items-center">
          <span className="mr-1.5 h-2 w-2 rounded-full bg-[#0D9040]" />
          Tenant: {displayTenant}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-md border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#6C5CE7] transition-colors"
          aria-label="Toggle dark/light theme"
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>

        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-[#3399FF] flex items-center justify-center text-xs font-bold text-[#0A0A0B]">
            {displayUser.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium text-[#FAFAFA] sm:inline-block">
            {displayUser}
          </span>
          {status === "authenticated" && (
            <button
              type="button"
              onClick={() => {
                logout();
              }}
              className="ml-2 rounded-md border border-[#2E2E32] bg-[#12121A] px-2.5 py-1 text-xs font-medium text-[#CF2020] hover:border-[#CF2020] transition-colors"
              aria-label="Sign out of workspace"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
