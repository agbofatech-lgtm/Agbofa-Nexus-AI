"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

export function PublicHeader() {
  const { status } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const workspaceHref = status === "authenticated" ? "/dashboard" : "/login";
  const workspaceLabel =
    status === "authenticated" ? "Open workspace" : "Sign in";

  return (
    <header className="public-header">
      <div className="public-header__inner">
        <Link
          aria-label="Agbofa Nexus AI home"
          className="public-brand"
          href="/"
        >
          <Image alt="" height={42} priority src="/logo.svg" width={174} />
        </Link>
        <nav aria-label="Public navigation" className="public-nav">
          <a href="#capabilities">Capabilities</a>
          <a href="#workflow">How it works</a>
          <Link href="/login">Reader workspace</Link>
        </nav>
        <div className="public-header__actions">
          <ThemeToggle />
          <Link className="public-sign-in" href={workspaceHref}>
            {workspaceLabel} <ArrowRight size={15} />
          </Link>
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            className="public-menu-button icon-button"
            onClick={() => setMobileOpen((open) => !open)}
            type="button"
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
      {mobileOpen ? (
        <nav
          aria-label="Mobile public navigation"
          className="public-mobile-nav glass-dark"
        >
          <a href="#capabilities" onClick={() => setMobileOpen(false)}>
            Capabilities
          </a>
          <a href="#workflow" onClick={() => setMobileOpen(false)}>
            How it works
          </a>
          <Link href={workspaceHref} onClick={() => setMobileOpen(false)}>
            {workspaceLabel}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
