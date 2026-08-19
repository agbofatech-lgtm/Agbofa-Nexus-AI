import type { ReactNode } from "react";

import { PublicFooter } from "@/components/features/public/PublicFooter";
import { PublicHeader } from "@/components/features/public/PublicHeader";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="public-shell">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
