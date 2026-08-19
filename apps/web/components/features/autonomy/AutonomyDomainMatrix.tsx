"use client";

import { CircleDollarSign, LockKeyhole, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type {
  AutonomyDomainPolicy,
  AutonomyLevel,
  AutonomyLevelDefinition,
} from "@/types/phase5-experience";

export function AutonomyDomainMatrix({
  domains,
  levels,
}: {
  domains: AutonomyDomainPolicy[];
  levels: AutonomyLevelDefinition[];
}) {
  const [localLevels, setLocalLevels] = useState<Record<string, AutonomyLevel>>({});
  const [message, setMessage] = useState("No local policy level has been changed.");
  const update = (domain: AutonomyDomainPolicy, level: AutonomyLevel) => {
    setLocalLevels((current) => ({ ...current, [domain.id]: level }));
    setMessage(`${domain.label} now displays Level ${level} in local simulation state. No policy was enforced and no capability was enabled.`);
  };
  return (
    <section className="autonomy-domain-matrix" aria-labelledby="domain-autonomy-title">
      <header><div><span>DOMAIN-SPECIFIC AUTONOMY</span><h2 id="domain-autonomy-title">Six domains. No misleading global switch.</h2></div><ExecutionRealityBadge reality="SIMULATED" /></header>
      <p className="autonomy-domain-matrix__message" aria-live="polite">{message}</p>
      <div>{domains.map((domain) => {
        const currentLevel = localLevels[domain.id] ?? domain.level;
        const definition = levels.find((level) => level.level === currentLevel);
        return <article key={domain.id}><header><div><span>{domain.id.replaceAll("_", " ")}</span><h3>{domain.label}</h3></div><b>{domain.policyState.replaceAll("_", " ")}</b></header><label>Simulated autonomy level<select aria-describedby={`${domain.id}-boundary`} onChange={(event) => update(domain, Number(event.target.value) as AutonomyLevel)} value={currentLevel}>{levels.map((level) => <option key={level.level} value={level.level}>Level {level.level} — {level.label}</option>)}</select></label><strong>{definition?.description}</strong><dl><div><dt>Approval</dt><dd>{domain.approvalRequirement.replaceAll("_", " ")}</dd></div><div><dt>Risk tolerance</dt><dd>{domain.riskTolerance}</dd></div><div><dt>Budget boundary</dt><dd><CircleDollarSign aria-hidden="true" size={11} /> {domain.budgetBoundary.amount === null ? "UNAVAILABLE" : `$${domain.budgetBoundary.amount.toLocaleString()} estimated`}</dd></div><div><dt>Intervention</dt><dd>{domain.humanInterventionRule}</dd></div></dl><div className="autonomy-actions"><section><span>ALLOWED IN SIMULATION</span><ul>{domain.allowedActions.map((action) => <li key={action}>{action}</li>)}</ul></section><section><span>RESTRICTED</span><ul>{domain.restrictedActions.map((action) => <li key={action}>{action}</li>)}</ul></section></div><footer id={`${domain.id}-boundary`}><LockKeyhole aria-hidden="true" size={12} /><span>Backend enforcement: {domain.backendEnforcement}</span><ExecutionRealityBadge reality={domain.executionReality} /></footer></article>;
      })}</div>
      <aside><ShieldAlert aria-hidden="true" /><p>Changing a level updates presentation state only. It cannot dispatch agents, approve work, publish, spend, route providers, or mutate external systems.</p></aside>
    </section>
  );
}
