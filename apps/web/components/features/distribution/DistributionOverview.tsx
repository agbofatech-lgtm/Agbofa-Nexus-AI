import { AlertTriangle, Layers3, RadioTower, Send, ShieldCheck } from "lucide-react";
import { Phase3AccountState } from "@/components/features/distribution/Phase3AccountState";
import { TruthStateBadge } from "@/components/features/phase3/TruthStateBadge";
import type { DistributionExperienceData } from "@/types/phase3-experience";

export function DistributionOverview({ data }: { data: DistributionExperienceData }) {
  const connected = data.accounts.filter((item) => item.state === "CONNECTED").length;
  const manual = data.accounts.filter((item) => item.state === "MANUAL").length;
  const approvals = data.publishingPlans.filter((item) => item.state === "REVIEW").length;
  const failures = data.publishingPlans.filter((item) => item.state === "FAILED").length;
  return (
    <div className="phase3-stack">
      <section className="phase3-kpis" aria-label="Distribution posture">
        <article><RadioTower aria-hidden="true" /><span>Verified connections</span><strong>{connected}</strong><small>OBSERVED IN FRONTEND</small></article>
        <article><Layers3 aria-hidden="true" /><span>Platform rule sets</span><strong>{data.platformRules.length}</strong><small>STRUCTURAL PREVIEWS</small></article>
        <article><ShieldCheck aria-hidden="true" /><span>Awaiting review</span><strong>{approvals}</strong><small>SIMULATED QUEUE</small></article>
        <article><AlertTriangle aria-hidden="true" /><span>Failure demonstrations</span><strong>{failures}</strong><small>NO PROVIDER EVENT</small></article>
      </section>

      <section className="phase3-feature phase3-feature--editorial">
        <div>
          <span>DISTRIBUTION POSTURE</span>
          <h2>Prepare everywhere. Execute nowhere.</h2>
          <p>
            The command layer coordinates platform intent while keeping the
            external boundary visible. {manual} account records are manual-only;
            the remaining records require creation, authorization, or recovery.
          </p>
        </div>
        <TruthStateBadge state="SIMULATED" />
      </section>

      <section className="publishing-machine" aria-labelledby="publishing-machine-title">
        <header>
          <div>
            <span>PLANNED STATE MACHINE</span>
            <h2 id="publishing-machine-title">Editorial intent → external boundary</h2>
          </div>
          <small>Every transition: externalEffect = false</small>
        </header>
        <ol>
          {data.publishingTransitions.map((item, index) => (
            <li key={item.state}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.label}</strong>
              <small>{index < 4 ? "editorial state" : index < 7 ? "delivery simulation" : "recovery simulation"}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="account-posture-split">
        <article>
          <span>BRAND ACCOUNT PLANE</span>
          <h3>Organization-owned destinations</h3>
          <p>No handle, Page, channel, or business profile is claimed as connected.</p>
          <div>
            {data.accounts.filter((item) => item.scope === "BRAND").slice(0, 5).map((item) => (
              <span key={item.id}><b>{item.platform}</b><Phase3AccountState state={item.state} /></span>
            ))}
          </div>
        </article>
        <article className="account-posture-split__personal">
          <span>PERSONAL ACCOUNT PLANE</span>
          <h3>Owner-controlled identities</h3>
          <p>Personal profiles remain separate and can only receive a manual copy handoff.</p>
          <div>
            {data.accounts.filter((item) => item.scope === "PERSONAL").map((item) => (
              <span key={item.id}><b>{item.platform}</b><Phase3AccountState state={item.state} /></span>
            ))}
          </div>
        </article>
      </section>

      <aside className="phase3-notice">
        <Send aria-hidden="true" size={18} />
        <div><strong>Publishing is intentionally unavailable</strong><p>Saved plans, schedules, approvals, failures, and retries are local interface states—not claims of delivery.</p></div>
      </aside>
    </div>
  );
}
