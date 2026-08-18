"use client";

import { DatabaseZap, FlaskConical } from "lucide-react";
import { usePathname } from "next/navigation";

import { getNavigationContextDetails } from "@/components/shared/navigation/navigation";

export function WorkspaceContextBar() {
  const pathname = usePathname();
  const context = getNavigationContextDetails(pathname);

  return (
    <aside aria-label="Data authority" className="workspace-context-bar">
      <div className="workspace-context-bar__section">
        <span>{context.label}</span>
        <i aria-hidden="true" />
        <small>{context.description}</small>
      </div>
      <div className="workspace-context-bar__authority" role="note">
        <span>
          <FlaskConical aria-hidden="true" size={12} /> Demo workspace
        </span>
        <span>
          <DatabaseZap aria-hidden="true" size={12} /> Mock adapters · not production authority
        </span>
      </div>
    </aside>
  );
}
