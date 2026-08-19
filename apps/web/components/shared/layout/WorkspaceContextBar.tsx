"use client";
import { DatabaseZap } from "lucide-react";
import { usePathname } from "next/navigation";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import { getNavigationContextDetails } from "@/components/shared/navigation/navigation";
import { createDataProvenance } from "@/types/data-state";
const provenance = createDataProvenance(
  "mock",
  "Frontend service adapters",
  "Development fixtures are active. Modules disclose integration availability contextually.",
);
export function WorkspaceContextBar() {
  const context = getNavigationContextDetails(usePathname());
  return (
    <aside aria-label="Workspace context" className="workspace-context-bar">
      <div className="workspace-context-bar__section">
        <span>{context.label}</span>
        <i aria-hidden="true" />
        <small>{context.description}</small>
      </div>
      <div className="workspace-context-bar__authority" role="note">
        <DataSourceIndicator provenance={provenance} />
        <span>
          <DatabaseZap aria-hidden="true" size={12} /> Integrations disclosed in
          context
        </span>
      </div>
    </aside>
  );
}
