"use client";

import { DatabaseZap, FlaskConical } from "lucide-react";
import { usePathname } from "next/navigation";

import { getNavigationGroup } from "@/components/shared/navigation/navigation";

export function WorkspaceContextBar() {
  const pathname = usePathname();
  const group = getNavigationGroup(pathname);

  return (
    <aside aria-label="Data authority" className="workspace-context-bar">
      <div className="workspace-context-bar__section">
        <span>{group.label}</span>
        <i aria-hidden="true" />
        <small>{group.description}</small>
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
