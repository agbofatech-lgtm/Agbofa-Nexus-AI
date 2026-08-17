"use client";

import React from "react";
import { useSession } from "./session-provider";
import { LoginForm } from "./login-form";

export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps): React.JSX.Element {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center bg-[#0A0A0B] text-[#FAFAFA]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2E2E32] border-t-[#3399FF]" />
        <p className="mt-3 text-sm font-medium text-[#A0A4A8]">
          Verifying tenant identity session...
        </p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center bg-[#0A0A0B] p-4">
        <LoginForm />
      </div>
    );
  }

  return <>{children}</>;
}
