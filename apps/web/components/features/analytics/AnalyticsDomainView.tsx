import { ArrowUpRight, DatabaseZap } from "lucide-react";
import Link from "next/link";
import { IntelligenceHierarchy } from "@/components/features/analytics/IntelligenceHierarchy";
import { TruthStateBadge } from "@/components/features/phase3/TruthStateBadge";
import type { AnalyticsDomain, AnalyticsMetric } from "@/types/phase3-experience";

export function AnalyticsDomainView({
  allMetrics,
  domain,
}: {
  allMetrics: AnalyticsMetric[];
  domain: AnalyticsDomain;
}) {
  const selected = allMetrics.find((item) => item.domain === domain) ?? allMetrics[0];
  if (!selected)
    return <aside className="phase3-notice"><DatabaseZap aria-hidden="true" /><div><strong>No metric contract</strong><p>This domain has no deterministic experience record.</p></div></aside>;
  return (
    <div className="phase3-stack">
      {domain === "overview" ? (
        <section className="analytics-domain-index" aria-labelledby="analytics-index-title">
          <header><div><span>TRUTH HIERARCHY</span><h2 id="analytics-index-title">Ten domains. No blended authority.</h2></div><p>Every headline remains attached to its own evidence class.</p></header>
          <div>
            {allMetrics.map((metric) => (
              <Link href={metric.domain === "overview" ? "/analytics" : `/analytics/${metric.domain}`} key={metric.id}>
                <header><span>{metric.domain.replaceAll("-", " ")}</span><ArrowUpRight aria-hidden="true" size={13} /></header>
                <strong>{metric.displayValue}</strong>
                <small>{metric.label}</small>
                <TruthStateBadge state={metric.truth} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <IntelligenceHierarchy metric={selected} />
      <aside className="metric-provenance">
        <div><span>PROVENANCE</span><strong>{selected.provenance.source}</strong></div>
        <p>{selected.provenance.detail}</p>
        <small>{selected.provenance.updatedAt ? selected.provenance.updatedAt.toISOString() : "No live observation timestamp"}</small>
      </aside>
    </div>
  );
}
