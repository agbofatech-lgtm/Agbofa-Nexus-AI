"use client";

import { BarChart3, ChevronRight, FlaskConical, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { ExperimentStateBadge } from "@/components/features/experiments/ExperimentStateBadge";
import { TruthStateBadge } from "@/components/features/phase3/TruthStateBadge";
import type { ExperimentationExperienceData } from "@/types/phase3-experience";

export function ExperimentWorkspace({ data }: { data: ExperimentationExperienceData }) {
  const [selectedId, setSelectedId] = useState(data.experiments[2]?.id ?? data.experiments[0]?.id ?? "");
  const selected = data.experiments.find((item) => item.id === selectedId) ?? data.experiments[0];
  if (!selected) return null;
  return (
    <div className="phase3-stack">
      <section className="experiment-lifecycle" aria-labelledby="experiment-lifecycle-title">
        <header><div><span>INTEGRITY-FIRST WORKFLOW</span><h2 id="experiment-lifecycle-title">From question to qualified learning</h2></div><TruthStateBadge state="SIMULATED" /></header>
        <ol>{data.lifecycle.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.replaceAll("_", " ")}</strong>{index < data.lifecycle.length - 1 ? <ChevronRight aria-hidden="true" size={13} /> : null}</li>)}</ol>
      </section>

      <div className="experiment-layout">
        <section className="experiment-register" aria-label="Simulated experiment register">
          <header><span>EXPERIMENT REGISTER</span><strong>{data.experiments.length} fixtures</strong></header>
          <div>{data.experiments.map((item) => (
            <button aria-pressed={selected.id === item.id} key={item.id} onClick={() => setSelectedId(item.id)} type="button">
              <ExperimentStateBadge state={item.state} />
              <strong>{item.name}</strong>
              <small>{item.successMetric}</small>
            </button>
          ))}</div>
        </section>

        <article className="experiment-detail">
          <header><div><span>{selected.id} · {selected.execution}</span><h2>{selected.name}</h2></div><ExperimentStateBadge state={selected.state} /></header>
          <section><span>HYPOTHESIS</span><p>{selected.hypothesis}</p></section>
          <div className="experiment-detail__spec">
            <section><span>AUDIENCE</span><strong>{selected.audience}</strong><small>No real enrollment</small></section>
            <section><span>SUCCESS METRIC</span><strong>{selected.successMetric}</strong><small>Simulation only</small></section>
          </div>
          <section className="experiment-variants"><span>VARIANTS</span><div>{selected.variants.map((variant) => <article key={variant.id}><strong>{variant.label}</strong><p>{variant.treatment}</p><small>{variant.allocationPercent}% simulated allocation</small></article>)}</div></section>
          {selected.result ? (
            <section className="experiment-result">
              <header><div><span>SIMULATED RESULT</span><h3>Inconclusive by design</h3></div><TruthStateBadge state="SIMULATED" /></header>
              <dl>
                <div><dt>Sample</dt><dd>{selected.result.controlSample.toLocaleString()} / {selected.result.variantSample.toLocaleString()}</dd></div>
                <div><dt>Rates</dt><dd>{selected.result.controlRate}% / {selected.result.variantRate}%</dd></div>
                <div><dt>Relative lift</dt><dd>{selected.result.relativeLift}%</dd></div>
                <div><dt>95% interval</dt><dd>{selected.result.confidenceInterval.minimum} to {selected.result.confidenceInterval.maximum} pp</dd></div>
                <div><dt>p-value</dt><dd>{selected.result.pValue}</dd></div>
                <div><dt>Significant</dt><dd>{selected.result.statisticallySignificant ? "Yes" : "No"}</dd></div>
              </dl>
              <p><BarChart3 aria-hidden="true" size={15} /> {selected.result.interpretation}</p>
            </section>
          ) : (
            <aside className="experiment-no-result"><FlaskConical aria-hidden="true" /><div><strong>No valid result</strong><p>This state has no statistical output. The interface will not manufacture one.</p></div></aside>
          )}
          <footer><span>LEARNING</span><p>{selected.learning}</p><small>Simulated attribution: {selected.agentId} · no agent execution</small></footer>
        </article>
      </div>
      <aside className="phase3-notice phase3-notice--gold"><ShieldAlert aria-hidden="true" size={18} /><div><strong>Statistical integrity</strong><p>The completed fixture uses 1,600 observations per variant, an 8.00% versus 9.06% rate, a confidence interval crossing zero, and p=0.282. It is explicitly inconclusive.</p></div></aside>
    </div>
  );
}
