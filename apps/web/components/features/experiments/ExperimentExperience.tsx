"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ExperimentBuilder } from "@/components/features/experiments/ExperimentBuilder";
import { ExperimentWorkspace } from "@/components/features/experiments/ExperimentWorkspace";
import { Phase3Header } from "@/components/features/phase3/Phase3Header";
import { Phase3WorkspaceNav } from "@/components/features/phase3/Phase3WorkspaceNav";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { usePhase3Experience } from "@/hooks/usePhase3Experience";

export type ExperimentView = "overview" | "create";
const config = {
  overview: { title: "Experiment Lab", subtitle: "Move from hypothesis to learning while keeping every execution and result explicitly simulated." },
  create: { title: "Experiment Builder", subtitle: "Design a local experiment specification. Creation saves no backend record and enrolls no audience." },
} as const;

export function ExperimentExperience({ view }: { view: ExperimentView }) {
  const experience = usePhase3Experience();
  const flags = useFeatureFlags();
  const shell = (content: ReactNode) => (
    <main className="phase3-page">
      <Phase3Header eyebrow="Phase 3 · Experimentation" provenance={experience.data?.experimentation.provenance} subtitle={config[view].subtitle} title={config[view].title} />
      <Phase3WorkspaceNav />
      <nav className="phase3-local-nav" aria-label="Experiment sections">
        <Link aria-current={view === "overview" ? "page" : undefined} href="/experiments">Experiment register</Link>
        <Link aria-current={view === "create" ? "page" : undefined} href="/experiments/new">Simulated builder</Link>
      </nav>
      {content}
    </main>
  );
  if (!flags.isEnabled("experiments"))
    return shell(<CapabilityBoundary detail="The experimentation experience flag is disabled. No hidden execution exists." title="Experimentation unavailable" />);
  if (experience.loading) return shell(<WorkspaceState state="loading" />);
  if (experience.error || !experience.data)
    return shell(<WorkspaceState message={experience.error ?? "Experimentation unavailable."} onRetry={experience.retry} state="error" />);
  const data = experience.data.experimentation;
  return shell(
    <>
      {view === "create" ? <ExperimentBuilder /> : <ExperimentWorkspace data={data} />}
      <CapabilityBoundary
        detail="Creation, audience assignment, execution, sample, result, and learning records are local deterministic simulation. No user is enrolled and no causal evidence is claimed."
        dependency="Governed event assignment, consent, analysis, and experiment runtime"
        reality="simulation"
        state="simulated"
        title="Experiment execution boundary"
      />
    </>,
  );
}
