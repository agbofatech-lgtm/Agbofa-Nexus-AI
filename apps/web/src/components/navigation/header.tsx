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
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[rgba(212,175,55,0.25)] bg-[rgba(5,5,7,0.85)] px-4 backdrop-blur-xl shadow-[0_1px_20px_rgba(212,175,55,0.06)] md:px-6">
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="inline-flex items-center justify-center rounded-lg p-2 text-[#D4AF37] hover:bg-[rgba(212,175,55,0.1)] focus:outline-none md:hidden transition-colors"
          aria-label="Toggle mobile menu"
        >
          <span className="text-xl">?</span>
        </button>
        <div className="md:hidden">
          <Logo compact={true} theme={theme} />
        </div>
        <div className="hidden md:block">
          <Logo compact={false} theme={theme} />
        </div>
        <span className="hidden text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/80 lg:inline-block">
          {AuthoritativeBrandIdentity.tagline}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden rounded-full border border-[rgba(51,153,255,0.4)] bg-[rgba(51,153,255,0.1)] px-4 py-1.5 text-xs font-semibold text-[#3399FF] shadow-[0_0_15px_rgba(51,153,255,0.15)] sm:flex sm:items-center backdrop-blur">
          <span className="mr-2 h-2 w-2 rounded-full bg-[#0D9040] shadow-[0_0_8px_rgba(13,144,64,0.6)] animate-pulse" />
          Tenant: {displayTenant}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.08)] px-3 py-1.5 text-xs font-medium text-[#D4AF37] hover:border-[#D4AF37] hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all"
          aria-label="Toggle dark/light theme"
        >
          {theme === "dark" ? "?? Light" : "?? Dark"}
        </button>

        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#3399FF] flex items-center justify-center text-xs font-bold text-[#050507] shadow-[0_0_15px_rgba(212,175,55,0.3)]">
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
              className="ml-2 rounded-lg border border-[rgba(207,32,32,0.4)] bg-[rgba(207,32,32,0.08)] px-3 py-1 text-xs font-medium text-[#CF2020] hover:border-[#CF2020] hover:shadow-[0_0_15px_rgba(207,32,32,0.2)] transition-all"
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
