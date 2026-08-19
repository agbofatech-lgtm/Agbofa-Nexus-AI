import { ArrowRight, CircleOff, Workflow } from "lucide-react";
import Link from "next/link";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { ExecutiveLoopNode } from "@/types/executive-command";

export function ExecutiveIntelligenceLoop({ loop }: { loop: ExecutiveLoopNode[] }) {
  return (
    <section className="executive-loop" aria-labelledby="executive-loop-title"><header><div><span>CROSS-SYSTEM INTELLIGENCE LOOP</span><h2 id="executive-loop-title">Observe → understand → discover → recommend → decide → execute → measure → learn → remember → next strategy</h2></div><p>Capability and execution reality are shown separately at every stage.</p></header><ol>{loop.map((node, index) => <li key={node.id}><Link href={node.href}><span>{String(node.order).padStart(2, "0")}</span>{node.id === "EXECUTE" ? <CircleOff aria-hidden="true" /> : <Workflow aria-hidden="true" />}<strong>{node.id.replaceAll("_", " ")}</strong><p>{node.description}</p><b>{node.capabilityState.replaceAll("_", " ")}</b><ExecutionRealityBadge reality={node.executionReality} /><DataSourceIndicator provenance={node.provenance} /></Link>{index < loop.length - 1 ? <ArrowRight aria-hidden="true" /> : null}</li>)}</ol></section>
  );
}
