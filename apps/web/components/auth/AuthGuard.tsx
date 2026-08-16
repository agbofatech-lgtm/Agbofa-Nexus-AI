"use client";

import { ShieldCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Skeleton } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/auth";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: readonly UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { session, status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const roleAllowed =
    !allowedRoles ||
    (session ? allowedRoles.includes(session.user.role) : false);

  useEffect(() => {
    if (status === "unauthenticated") {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
    }
  }, [pathname, router, status]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="auth-guard-state" aria-busy="true" aria-live="polite">
        <div className="auth-guard-state__mark">
          <ShieldCheck size={24} />
        </div>
        <div>
          <strong>Securing your workspace</strong>
          <span>Validating the active Nexus session…</span>
        </div>
        <Skeleton height={8} rounded="full" width={190} />
      </main>
    );
  }

  if (!roleAllowed) {
    return (
      <main className="auth-guard-state" role="alert">
        <div className="auth-guard-state__mark auth-guard-state__mark--error">
          <ShieldCheck size={24} />
        </div>
        <div>
          <strong>Access restricted</strong>
          <span>
            Your account does not have permission to open this workspace.
          </span>
        </div>
      </main>
    );
  }

  return children;
}
