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
      <div className="flex min-h-screen flex-col text-[#FAFAFA] animate-fade-in"
           style={{
             background: "radial-gradient(ellipse at 20% 20%, rgba(108, 92, 231, 0.06), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(212, 175, 55, 0.05), transparent 50%), #050507",
           }}>
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
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden rounded-lg border border-[rgba(212,175,55,0.3)] bg-[rgba(18,18,26,0.8)] px-3 py-1.5 text-xs font-medium text-[#D4AF37] backdrop-blur-xl transition-all hover:bg-[rgba(212,175,55,0.1)] hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] md:inline-block"
              >
                {collapsed ? "Expand Sidebar ?" : "? Collapse Sidebar"}
              </button>
            </div>
            <div className="animate-slide-up">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
