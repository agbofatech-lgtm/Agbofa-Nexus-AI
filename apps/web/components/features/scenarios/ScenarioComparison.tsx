"use client";

import { AlertTriangle, CircleDollarSign, Gauge, GitCompareArrows } from "lucide-react";
import { useState } from "react";
import { ConfidenceBadge } from "@/components/shared/states";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { ProjectionRange, ScenarioRecord } from "@/types/phase5-experience";

function RangeBar({ label, range }: { label: string; range: ProjectionRange }) {
  return (
    <div className="scenario-range"><span>{label}</span><div aria-label={`${label}: ${range.minimum} to ${range.maximum} ${range.unit}`} role="img"><i style={{ left: `${Math.min(range.minimum, 100)}%`, width: `${Math.max(Math.min(range.maximum, 100) - Math.min(range.minimum, 100), 2)}%` }} /></div><strong>{range.minimum}–{range.maximum} {range.unit}</strong></div>
  );
}

export function ScenarioComparison({ scenarios }: { scenarios: ScenarioRecord[] }) {
  const [selectedId, setSelectedId] = useState(scenarios[0]?.id ?? "");
  const selected = scenarios.find((scenario) => scenario.id === selectedId) ?? scenarios[0];
  if (!selected) return null;
  return (
    <div className="phase5-stack">
      <section className="scenario-selector" aria-label="Scenario comparison selection">{scenarios.map((scenario) => <button aria-pressed={selected.id === scenario.id} key={scenario.id} onClick={() => setSelectedId(scenario.id)} type="button"><span>{scenario.mode.replaceAll("_", " ")}</span><strong>{scenario.name}</strong><small>{scenario.optimizationCriterion}</small><div><b>${scenario.projection.cost.minimum}–${scenario.projection.cost.maximum} estimated</b><b>{scenario.qualityScore} quality</b></div></button>)}</section>
      <article className="scenario-detail"><header><div><span>{selected.id} · {selected.mode.replaceAll("_", " ")}</span><h2>{selected.name}</h2></div><div><ConfidenceBadge confidence={selected.confidence} /><ExecutionRealityBadge reality={selected.executionReality} /></div></header><p>{selected.expectedImpact}</p><div className="scenario-detail__columns"><section><span>VARIABLES</span><dl>{selected.variables.map((variable) => <div key={variable.label}><dt>{variable.label}</dt><dd>{variable.value}</dd></div>)}</dl></section><section><span>ASSUMPTIONS</span><ol>{selected.assumptions.map((assumption, index) => <li key={assumption}><b>{index + 1}</b>{assumption}</li>)}</ol></section><section><span>TRADE-OFFS</span><ul>{selected.tradeOffs.map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}</ul></section></div><section className="scenario-projections"><header><span>PROJECTION RANGES · NOT GUARANTEES</span><small>{selected.timeHorizonDays}-day horizon</small></header><RangeBar label="Audience" range={selected.projection.audience} /><RangeBar label="Engagement" range={selected.projection.engagement} /><RangeBar label="Reach" range={selected.projection.reach} /><RangeBar label="Estimated cost" range={selected.projection.cost} /></section><div className="scenario-truth-grid"><section><span>QUALITY</span><strong><Gauge aria-hidden="true" /> {selected.qualityScore}/100 modeled</strong></section><section><span>RISK</span><strong><AlertTriangle aria-hidden="true" /> {selected.risk}</strong><small>{selected.riskRationale}</small></section><section><span>PROJECTED REVENUE</span><strong>{selected.projection.revenue.label}</strong><small>No authoritative revenue source</small></section><section><span>PROJECTED ROI</span><strong>{selected.projection.roi.label}</strong><small>No attributable return source</small></section></div><footer><GitCompareArrows aria-hidden="true" /><p>Optimizes for: {selected.optimizationCriterion}. This does not make the scenario “best” for another objective.</p><small>{selected.dataSourceLabel}</small></footer></article>
      <section className="scenario-comparison-table" aria-labelledby="scenario-comparison-title"><header><div><span>FOUR-WAY COMPARISON</span><h2 id="scenario-comparison-title">Baseline vs high quality vs balanced vs low cost</h2></div><p>Every column is simulated and criterion-dependent.</p></header><div className="responsive-table"><table><thead><tr><th>Scenario</th><th>Estimated cost</th><th>Impact</th><th>Quality</th><th>Risk</th><th>Confidence</th><th>Criterion</th><th>Financial truth</th></tr></thead><tbody>{scenarios.map((scenario) => <tr key={scenario.id}><th scope="row">{scenario.name}<small>{scenario.mode.replaceAll("_", " ")}</small></th><td><CircleDollarSign aria-hidden="true" size={11} /> ${scenario.projection.cost.minimum}–${scenario.projection.cost.maximum}</td><td>{scenario.expectedImpact}</td><td>{scenario.qualityScore}/100</td><td>{scenario.risk}</td><td>{scenario.confidence.score}%</td><td>{scenario.optimizationCriterion}</td><td>Revenue: UNAVAILABLE<small>ROI: UNAVAILABLE</small></td></tr>)}</tbody></table></div></section>
    </div>
  );
}
