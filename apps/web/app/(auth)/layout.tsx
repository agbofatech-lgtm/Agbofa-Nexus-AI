import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <Link aria-label="Agbofa Nexus AI home" href="/">
          <Image
            alt="Agbofa Nexus AI"
            height={42}
            priority
            src="/logo.svg"
            width={174}
          />
        </Link>
        <ThemeToggle />
      </header>
      <main className="auth-main">{children}</main>
      <footer className="auth-footer">
        Secure tenant access · Agbofa Technologies
      </footer>
    </div>
  );
}
