import { CheckCircle2, CircleOff, DatabaseZap } from "lucide-react";
import Link from "next/link";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type {
  CrossPhaseIntegrityRecord,
  ExecutiveCapabilityHealth as Health,
} from "@/types/executive-command";

export function ExecutiveCapabilityHealth({
  capabilities,
  integrity,
}: {
  capabilities: Health[];
  integrity: CrossPhaseIntegrityRecord[];
}) {
  const broken = integrity.filter((item) => item.status === "BROKEN");
  return (
    <section className="executive-health" aria-labelledby="executive-health-title"><header><div><span>GLOBAL CAPABILITY & HEALTH</span><h2 id="executive-health-title">Availability is not telemetry reality</h2></div><aside className={broken.length ? "executive-integrity executive-integrity--broken" : "executive-integrity"}>{broken.length ? <CircleOff aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}<div><strong>{broken.length ? `${broken.length} broken relationships` : `${integrity.length} cross-phase relationships valid`}</strong><small>Static adapter validation</small></div></aside></header><div className="responsive-table"><table><thead><tr><th>Domain</th><th>Capability</th><th>What it means</th><th>Telemetry reality</th><th>Execution reality</th><th>Provenance</th><th>Drill-down</th></tr></thead><tbody>{capabilities.map((item) => <tr key={item.id}><th scope="row">{item.domain}<small>{item.sourceId}</small></th><td><b className={`executive-capability executive-capability--${item.capability.toLowerCase()}`}>{item.capability.replaceAll("_", " ")}</b></td><td>{item.detail}</td><td>{item.telemetryReality}</td><td><ExecutionRealityBadge reality={item.executionReality} /></td><td><DataSourceIndicator provenance={item.provenance} /></td><td><Link href={item.href}>Open →</Link></td></tr>)}</tbody></table></div><footer><DatabaseZap aria-hidden="true" /><p>No row is HEALTHY merely because a React component rendered. UNAVAILABLE, NOT_CONNECTED, PENDING, ESTIMATED, and SIMULATED remain visible.</p></footer></section>
  );
}
