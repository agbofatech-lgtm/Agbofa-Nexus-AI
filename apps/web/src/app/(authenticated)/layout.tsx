"use client";

import React, { useState } from "react";
import { Header } from "../../components/navigation/header";
import { Sidebar } from "../../components/navigation/sidebar";
import { AuthGuard } from "../../components/auth/auth-guard";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-[#0A0A0B] text-[#FAFAFA]">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          tenantName="Default Tenant"
          userEmail="editor@agbofa.com"
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            collapsed={collapsed}
          />
          <main className="flex-1 overflow-y-auto bg-[#0A0A0B] p-4 md:p-6">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden rounded border border-[#2E2E32] bg-[#12121A] px-2 py-1 text-xs font-medium text-[#A0A4A8] hover:text-[#FAFAFA] md:inline-block"
              >
                {collapsed ? "Expand Sidebar ⟫" : "⟪ Collapse Sidebar"}
              </button>
            </div>
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
