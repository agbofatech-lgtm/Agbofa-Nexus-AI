"use client";

import { Clock3, ShieldCheck } from "lucide-react";
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
    if (status === "unauthenticated" || status === "expired") {
      const next = encodeURIComponent(pathname || "/dashboard");
      const reason = status === "expired" ? "&reason=session-expired" : "";
      router.replace(`/login?next=${next}${reason}`);
    }
  }, [pathname, router, status]);

  if (status === "expired") {
    return (
      <main className="auth-guard-state" role="alert">
        <div className="auth-guard-state__mark auth-guard-state__mark--error">
          <Clock3 size={24} />
        </div>
        <div>
          <strong>Your demo session expired</strong>
          <span>Returning to the frontend access preview…</span>
        </div>
      </main>
    );
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="auth-guard-state" aria-busy="true" aria-live="polite">
        <div className="auth-guard-state__mark">
          <ShieldCheck size={24} />
        </div>
        <div>
          <strong>Checking the demo workspace session</strong>
          <span>Reading browser-local frontend session state…</span>
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
            This frontend role presentation does not include this workspace.
            Authoritative server authorization is not implemented here.
          </span>
        </div>
      </main>
    );
  }

  return children;
}
