import { History } from "lucide-react";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { AutonomyAuditRecord } from "@/types/phase5-experience";

export function AutonomyAuditHistory({ records }: { records: AutonomyAuditRecord[] }) {
  return (
    <section className="autonomy-audit" aria-labelledby="autonomy-audit-title">
      <header><div><span>AUTONOMY AUDIT</span><h2 id="autonomy-audit-title">Simulation activity history</h2></div><History aria-hidden="true" /></header>
      <div className="responsive-table"><table><thead><tr><th>Action</th><th>Target</th><th>Actor / time</th><th>Previous</th><th>Result</th><th>Reason</th><th>Reality</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><th scope="row">{record.action.replaceAll("_", " ")}<small>{record.id}</small></th><td>{record.target}</td><td>{record.actor}<small><time dateTime={record.timestamp}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(record.timestamp))}</time></small></td><td>{record.previousState.replaceAll("_", " ")}</td><td>{record.resultingState.replaceAll("_", " ")}</td><td>{record.reason}</td><td><ExecutionRealityBadge reality={record.executionReality} /></td></tr>)}</tbody></table></div>
    </section>
  );
}
