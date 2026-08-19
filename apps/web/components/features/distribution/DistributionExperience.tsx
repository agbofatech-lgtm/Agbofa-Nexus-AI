"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DistributionAccounts } from "@/components/features/distribution/DistributionAccounts";
import { DistributionHealth } from "@/components/features/distribution/DistributionHealth";
import { DistributionOverview } from "@/components/features/distribution/DistributionOverview";
import { DistributionStudio } from "@/components/features/distribution/DistributionStudio";
import { PublishingQueue } from "@/components/features/distribution/PublishingQueue";
import { Phase3Header } from "@/components/features/phase3/Phase3Header";
import { Phase3WorkspaceNav } from "@/components/features/phase3/Phase3WorkspaceNav";
import { CapabilityBoundary, WorkspaceState } from "@/components/shared/states";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { usePhase3Experience } from "@/hooks/usePhase3Experience";

export type DistributionView = "overview" | "accounts" | "studio" | "queue" | "health";

const config: Record<DistributionView, { title: string; subtitle: string }> = {
  overview: {
    title: "Distribution Command",
    subtitle:
      "Plan account posture, platform adaptation, approval, queue, and recovery without implying a provider connection.",
  },
  accounts: {
    title: "Account Directory",
    subtitle:
      "Keep brand properties and owner-controlled personal identities visibly separate across eleven platform experiences.",
  },
  studio: {
    title: "Content Studio",
    subtitle:
      "Compare deterministic channel adaptations, format constraints, calls to action, and structural previews before review.",
  },
  queue: {
    title: "Publishing Queue",
    subtitle:
      "Inspect every modeled publishing state. Approval and retry controls change local plans only.",
  },
  health: {
    title: "Distribution Health",
    subtitle:
      "Separate template readiness from unavailable provider health and expose the correct recovery boundary.",
  },
};

const nav = [
  ["Overview", "/distribution"],
  ["Accounts", "/distribution/accounts"],
  ["Content Studio", "/distribution/studio"],
  ["Queue & approvals", "/distribution/queue"],
  ["Health", "/distribution/health"],
] as const;

function DistributionLocalNav({ view }: { view: DistributionView }) {
  const viewOrder: DistributionView[] = ["overview", "accounts", "studio", "queue", "health"];
  return (
    <nav className="phase3-local-nav" aria-label="Distribution sections">
      {nav.map(([label, href], index) => (
        <Link
          aria-current={viewOrder[index] === view ? "page" : undefined}
          href={href}
          key={href}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function DistributionExperience({ view }: { view: DistributionView }) {
  const experience = usePhase3Experience();
  const flags = useFeatureFlags();
  const c = config[view];
  const shell = (content: ReactNode) => (
    <main className="phase3-page">
      <Phase3Header
        eyebrow="Phase 3 · Distribution"
        provenance={experience.data?.distribution.provenance}
        subtitle={c.subtitle}
        title={c.title}
      />
      <Phase3WorkspaceNav />
      <DistributionLocalNav view={view} />
      {content}
    </main>
  );

  if (!flags.isEnabled("distribution"))
    return shell(
      <CapabilityBoundary
        detail="The frontend experience flag is disabled. No hidden provider execution exists."
        title="Distribution unavailable"
      />,
    );
  if (experience.loading) return shell(<WorkspaceState state="loading" />);
  if (experience.error || !experience.data)
    return shell(
      <WorkspaceState
        message={experience.error ?? "Distribution experience unavailable."}
        onRetry={experience.retry}
        state="error"
      />,
    );

  const data = experience.data.distribution;
  const content =
    view === "accounts" ? (
      <DistributionAccounts accounts={data.accounts} />
    ) : view === "studio" ? (
      <DistributionStudio accounts={data.accounts} rules={data.platformRules} />
    ) : view === "queue" ? (
      <PublishingQueue
        plans={data.publishingPlans}
        transitions={data.publishingTransitions}
      />
    ) : view === "health" ? (
      <DistributionHealth records={data.health} />
    ) : (
      <DistributionOverview data={data} />
    );

  return shell(
    <>
      {content}
      <CapabilityBoundary
        detail="All connection, adaptation, approval, schedule, publish, failure, and retry states are deterministic frontend plans. No OAuth, social API, provider mutation, or external delivery occurs."
        dependency="Reviewed backend, authorization, provider, audit, and consent contracts"
        reality="simulation"
        state="simulated"
        title="Distribution execution boundary"
      />
    </>,
  );
}
