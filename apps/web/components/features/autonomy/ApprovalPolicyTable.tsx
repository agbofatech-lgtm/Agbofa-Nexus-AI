import { LockKeyhole, ShieldCheck } from "lucide-react";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { ApprovalPolicy } from "@/types/phase5-experience";

export function ApprovalPolicyTable({ policies }: { policies: ApprovalPolicy[] }) {
  return (
    <section className="approval-policy-table" aria-labelledby="approval-policy-title">
      <header><div><span>APPROVAL POLICIES</span><h2 id="approval-policy-title">Policy intent without backend enforcement</h2></div><p>Nine future-policy patterns remain inspectable and explicitly simulated.</p></header>
      <div className="responsive-table"><table><thead><tr><th>Policy</th><th>Domain</th><th>Trigger</th><th>Approval</th><th>Risk</th><th>Scope</th><th>State</th><th>Execution</th></tr></thead><tbody>{policies.map((policy) => <tr key={policy.id}><th scope="row"><ShieldCheck aria-hidden="true" size={11} /> {policy.name}<small>{policy.id}</small></th><td>{policy.domain.replaceAll("_", " ")}</td><td>{policy.trigger}</td><td>{policy.approvalRequirement.replaceAll("_", " ")}</td><td>{policy.risk}</td><td>{policy.actionScope}</td><td>{policy.state.replaceAll("_", " ")}<small><LockKeyhole aria-hidden="true" size={10} /> Enforcement unavailable</small></td><td><ExecutionRealityBadge reality={policy.executionReality} /></td></tr>)}</tbody></table></div>
    </section>
  );
}
