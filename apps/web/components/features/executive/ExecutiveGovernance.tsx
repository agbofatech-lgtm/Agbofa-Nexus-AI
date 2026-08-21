import Link from "next/link";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { ExecutiveGovernance as Governance, ExecutiveLiveSources } from "@/types/executive-command";

export function ExecutiveGovernance({
  governance,
  liveSources,
}: {
  governance: Governance;
  liveSources: ExecutiveLiveSources;
}) {
  return (
    <section className="executive-governance" aria-labelledby="executive-governance-title">
      <header>
        <div>
          <span>GOVERNANCE BOUNDARIES</span>
          <h2 id="executive-governance-title">Autonomy, kill-switch, brand, and memory stay enforced</h2>
        </div>
        <p>Display does not grant autonomy, publish, spend, or disable safety.</p>
      </header>
      <div className="executive-governance__grid">
        <article>
          <header>
            <span>KILL SWITCH</span>
            <ExecutionRealityBadge reality={governance.killSwitch.executionReality} />
          </header>
          <strong>{governance.killSwitch.state}</strong>
          <p>{governance.killSwitch.note}</p>
          <small>
            Source {governance.killSwitch.source} · schedule blocked {governance.killSwitch.blocksPublishingSchedule ? "YES" : "NO"}
          </small>
          <Link href="/ai-control/autonomy">Autonomy control →</Link>
        </article>
        <article>
          <header>
            <span>AUTONOMY DOMAINS</span>
            <ExecutionRealityBadge reality={governance.autonomy.domains[0]?.executionReality ?? "PENDING"} />
          </header>
          <strong>Global {governance.autonomy.globalLevel ?? "PENDING"}</strong>
          <ul>
            {governance.autonomy.domains.map((domain) => (
              <li key={domain.id}>
                <b>{domain.label}</b>
                <span>L{domain.level}</span>
                <small>{domain.approvalRequirement}</small>
              </li>
            ))}
          </ul>
          <small>Source {governance.autonomy.source} · grants autonomy: never</small>
        </article>
        <article>
          <header><span>PUBLISHING + BRAND</span></header>
          <ol>
            {governance.publishing.chain.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>{governance.branding.note}</p>
          <Link href="/distribution">Publishing workflow →</Link>
        </article>
        <article>
          <header><span>MEMORY / SCENARIO / COST</span></header>
          <p>{governance.memoryPrivilege.note}</p>
          <p>{governance.scenarios.note}</p>
          <p>{governance.cost.note}</p>
          <small>
            BFF session {liveSources.session} · memory {liveSources.memory} · cost {liveSources.cost}
          </small>
        </article>
      </div>
    </section>
  );
}
