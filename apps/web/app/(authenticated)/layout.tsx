import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/shared/layout/Layout";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
}
