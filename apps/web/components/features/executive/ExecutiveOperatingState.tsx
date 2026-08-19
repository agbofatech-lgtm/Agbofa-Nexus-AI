import { Bot, CircleDollarSign, FlaskConical, Library } from "lucide-react";
import Link from "next/link";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import { ConfidenceBadge } from "@/components/shared/states";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type {
  ExecutiveEconomicsSummary,
  ExecutiveExperimentSummary,
  ExecutiveLearningSummary,
  ExecutiveMetric,
  ExecutiveWorkforceSummary,
} from "@/types/executive-command";

export function ExecutiveOperatingState({
  metrics,
  workforce,
  experiments,
  economics,
  learning,
}: {
  metrics: ExecutiveMetric[];
  workforce: ExecutiveWorkforceSummary;
  experiments: ExecutiveExperimentSummary;
  economics: ExecutiveEconomicsSummary;
  learning: ExecutiveLearningSummary;
}) {
  return (
    <div className="executive-operating-state">
      <section className="executive-metrics" aria-labelledby="executive-metrics-title">
        <header><div><span>PERFORMANCE & AUTHORITY</span><h2 id="executive-metrics-title">Metrics without blended truth</h2></div><p>Every value retains its canonical authority and execution reality.</p></header>
        <div>{metrics.map((metric) => <article key={metric.id}><header><span>{metric.authority.toUpperCase()}</span><ExecutionRealityBadge reality={metric.executionReality} /></header><strong>{metric.displayValue}</strong><p>{metric.label}</p><small>{metric.context}</small><footer><DataSourceIndicator provenance={metric.provenance} />{metric.confidence ? <ConfidenceBadge compact confidence={metric.confidence} /> : null}</footer></article>)}</div>
      </section>
      <section className="executive-operating-grid">
        <article><header><span>AGENT WORKFORCE</span><Bot aria-hidden="true" /></header><strong>{workforce.total}</strong><p>canonical agents</p><dl><div><dt>Working</dt><dd>{workforce.working}</dd></div><div><dt>Blocked</dt><dd>{workforce.blocked}</dd></div><div><dt>Waiting approval</dt><dd>{workforce.waitingApproval}</dd></div><div><dt>Completed / failed</dt><dd>{workforce.completed} / {workforce.failed}</dd></div></dl><footer><ExecutionRealityBadge reality={workforce.executionReality} /><Link href="/agents">Workforce →</Link></footer></article>
        <article><header><span>EXPERIMENTS</span><FlaskConical aria-hidden="true" /></header><strong>{experiments.active} / {experiments.completed}</strong><p>active / completed fixtures</p><b>{experiments.resultState.replaceAll("_", " ")}</b><small>{experiments.learning}</small><footer><ConfidenceBadge compact confidence={experiments.confidence} /><Link href={experiments.href}>Experiment Lab →</Link></footer></article>
        <article><header><span>LEARNING</span><Library aria-hidden="true" /></header><strong>{learning.memoryState.replaceAll("_", " ")}</strong><p>{learning.insight}</p><small>{learning.evidenceCount} evidence sources · sample {learning.sampleSize?.toLocaleString() ?? "N/A"}</small><footer><ConfidenceBadge compact confidence={learning.confidence} /><Link href={learning.href}>Memory →</Link></footer></article>
        <article><header><span>AI ECONOMICS</span><CircleDollarSign aria-hidden="true" /></header><strong>${economics.estimatedTaskCost.toFixed(2)}</strong><p>selected-task estimate</p><dl><div><dt>Modeled budget</dt><dd>${economics.estimatedBudget}</dd></div><div><dt>Actual cost</dt><dd>{economics.actualCost}</dd></div><div><dt>Revenue</dt><dd>{economics.actualRevenue}</dd></div><div><dt>Verified ROI</dt><dd>{economics.verifiedRoi}</dd></div></dl><footer><ExecutionRealityBadge reality={economics.executionReality} /><Link href="/ai-cost">AI Economics →</Link></footer></article>
      </section>
    </div>
  );
}
