"use client";

import { ArrowRight, BrainCircuit, CircleOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ApprovalPolicyTable } from "@/components/features/autonomy/ApprovalPolicyTable";
import { AutonomyAuditHistory } from "@/components/features/autonomy/AutonomyAuditHistory";
import { AutonomyDomainMatrix } from "@/components/features/autonomy/AutonomyDomainMatrix";
import { KillSwitchControl } from "@/components/features/autonomy/KillSwitchControl";
import { HumanOverrideConsole } from "@/components/features/strategy/HumanOverrideConsole";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type {
  AutonomyAuditRecord,
  Phase5ExperienceData,
} from "@/types/phase5-experience";
import type { StrategyDirectorData } from "@/types/strategy-director";

const extendedActions = [
  { id: "require-approval", label: "Require approval", requestedState: "APPROVAL_REQUIRED_SIMULATED" },
  { id: "disable-domain", label: "Disable domain", requestedState: "DOMAIN_DISABLED_SIMULATED" },
  { id: "lower-level", label: "Lower autonomy level", requestedState: "LEVEL_LOWERED_SIMULATED" },
  { id: "raise-level", label: "Raise autonomy level", requestedState: "LEVEL_RAISE_REQUESTED_SIMULATED" },
] as const;

export function AutonomyControlCenter({
  phase5,
  strategy,
}: {
  phase5: Phase5ExperienceData;
  strategy: StrategyDirectorData;
}) {
  const [audit, setAudit] = useState<AutonomyAuditRecord[]>(
    phase5.autonomyAudit,
  );
  const configured = phase5.autonomyDomains.filter((item) => item.policyState === "CONFIGURED").length;
  const maximum = Math.max(...phase5.autonomyDomains.map((item) => item.level));
  return (
    <div className="phase5-stack">
      <section className="autonomy-posture">
        <div><span>POLICY POSTURE</span><h2>Configured for simulation. Incapable of execution.</h2><p>{configured} of {phase5.autonomyDomains.length} domains have simulated policy configurations. The highest configured level is {maximum}; all backend enforcement remains unavailable.</p></div>
        <aside><BrainCircuit aria-hidden="true" /><strong>LEVEL {maximum}</strong><span>maximum simulated configuration</span><ExecutionRealityBadge reality="SIMULATED" /><small><CircleOff aria-hidden="true" size={11} /> Backend enforcement unavailable</small></aside>
      </section>
      <section className="autonomy-levels" aria-labelledby="autonomy-level-title">
        <header><div><span>LEVEL MODEL</span><h2 id="autonomy-level-title">Observe → recommend → prepare → approval-gated → bounded → autonomous</h2></div><p>Levels describe what a future governed system could do. They do not activate current capabilities.</p></header>
        <ol>{phase5.levelDefinitions.map((item) => <li className={item.level <= maximum ? "autonomy-level autonomy-level--configured-range" : "autonomy-level"} key={item.level}><span>LEVEL {item.level}</span><strong>{item.label}</strong><p>{item.description}</p><small>{item.humanRole}</small><ExecutionRealityBadge reality={item.executionReality} /></li>)}</ol>
      </section>
      <AutonomyDomainMatrix domains={phase5.autonomyDomains} levels={phase5.levelDefinitions} />
      <ApprovalPolicyTable policies={phase5.approvalPolicies} />
      <section className="autonomy-run-preview">
        <div><span>RUN SIMULATION</span><h2>Plan → prepare → approval → simulated execution → review → simulated result</h2><p>{phase5.runs.length} deterministic runs expose budgets, gates, intervention points, canonical agents, and outcomes without dispatching work.</p></div>
        <Link href="/growth/runs">Open simulated runs <ArrowRight aria-hidden="true" size={13} /></Link>
      </section>
      <HumanOverrideConsole
        additionalActions={extendedActions}
        additionalTargets={phase5.autonomyDomains.map((domain) => ({ id: domain.id, label: `Autonomy domain · ${domain.label}` }))}
        history={strategy.overrideHistory}
        plans={strategy.plans}
        workforce={strategy.workforce}
      />
      <KillSwitchControl
        initial={phase5.killSwitch}
        onAudit={(record) => setAudit((current) => [record, ...current])}
      />
      <AutonomyAuditHistory records={audit} />
      <aside className="phase5-trust-note"><ShieldCheck aria-hidden="true" /><div><strong>Human control remains primary</strong><p>Nexus recommends and simulates. A human reviews. No frontend action becomes backend authorization or execution.</p></div></aside>
    </div>
  );
}
