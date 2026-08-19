"use client";
import { Boxes, Bot, Flag, Route } from "lucide-react";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import {
  CapabilityBoundary,
  DomainStatusBadge,
  WorkspaceState,
} from "@/components/shared/states";
import { usePhase1Foundation } from "@/hooks/usePhase1Foundation";
import { futureWorkspaceRoutes } from "@/lib/config/phase2-workspaces";
export function Phase1FoundationStatus() {
  const foundation = usePhase1Foundation();
  if (foundation.loading)
    return (
      <WorkspaceState state="loading" title="Loading frontend foundation" />
    );
  if (foundation.error || !foundation.value?.data)
    return (
      <WorkspaceState
        message={foundation.error ?? "Foundation metadata is unavailable."}
        onRetry={foundation.retry}
        state="error"
      />
    );
  const snapshot = foundation.value.data;
  const enabled = Object.values(snapshot.features).filter(Boolean).length;
  const executionEnabled = Object.values(snapshot.execution).filter(
    Boolean,
  ).length;
  const futureRoutes = futureWorkspaceRoutes.filter(
    (route) => route.readiness !== "existing",
  ).length;
  return (
    <section
      className="foundation-status"
      aria-labelledby="foundation-status-title"
    >
      <header>
        <div>
          <span>Frontend OS foundation</span>
          <h2 id="foundation-status-title">
            Reconstructed capability architecture
          </h2>
        </div>
        <DataSourceIndicator details provenance={snapshot.provenance} />
      </header>
      <div className="foundation-status__metrics">
        <article>
          <Bot size={17} />
          <strong>{snapshot.canonicalAgentCount}</strong>
          <span>canonical agents</span>
        </article>
        <article>
          <Flag size={17} />
          <strong>{enabled}</strong>
          <span>frontend flags enabled</span>
        </article>
        <article>
          <Route size={17} />
          <strong>{futureRoutes}</strong>
          <span>future route contracts</span>
        </article>
        <article>
          <Boxes size={17} />
          <strong>{executionEnabled}</strong>
          <span>execution flags enabled</span>
        </article>
      </div>
      <div className="foundation-status__capabilities">
        {snapshot.capabilities.map((c) => (
          <article key={c.id}>
            <div>
              <strong>{c.label}</strong>
              <p>{c.description}</p>
            </div>
            <DomainStatusBadge status={c.state} />
          </article>
        ))}
      </div>
      <CapabilityBoundary
        dependency="backend strategy, orchestration, authorization, publishing, and provider services"
        detail="This reconstruction establishes contracts, flags, adapters, hooks, and shared UI states only. No strategy, autonomy, paid growth, publishing, provider routing, or memory action can execute."
        title="Execution remains intentionally disabled"
      />
    </section>
  );
}
