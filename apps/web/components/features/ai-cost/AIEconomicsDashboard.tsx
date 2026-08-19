import { CircleDollarSign, DatabaseZap, Gauge } from "lucide-react";
import { BudgetSimulation } from "@/components/features/ai-cost/BudgetSimulation";
import { CostAwareStrategy } from "@/components/features/ai-cost/CostAwareStrategy";
import { ModelRoutingVisibility } from "@/components/features/ai-cost/ModelRoutingVisibility";
import { ConfidenceBadge } from "@/components/shared/states";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type { Phase5ExperienceData } from "@/types/phase5-experience";
import type { StrategyDirectorPlan } from "@/types/strategy-director";

export function AIEconomicsDashboard({
  data,
  strategies,
}: {
  data: Phase5ExperienceData;
  strategies: StrategyDirectorPlan[];
}) {
  return (
    <div className="phase5-stack">
      <section className="financial-truth-contract">
        <div><span>FINANCIAL TRUTH CONTRACT</span><h2>Estimated operations. Unavailable financial truth.</h2><p>Model, token, quality, latency, and task costs are deterministic planning assumptions. They are not provider invoices, recognized revenue, savings, or verified returns.</p></div>
        <dl><div><dt>Actual cost</dt><dd>{data.financialTruth.actualCost.label}</dd></div><div><dt>Actual revenue</dt><dd>{data.financialTruth.actualRevenue.label}</dd></div><div><dt>Verified ROI</dt><dd>{data.financialTruth.verifiedRoi.label}</dd></div></dl>
      </section>
      <ModelRoutingVisibility candidates={data.modelCandidates} routes={data.routingSimulations} />
      <section className="task-cost-table" aria-labelledby="task-cost-title"><header><div><span>ESTIMATED TASK ECONOMICS</span><h2 id="task-cost-title">Task → agents → model → tokens → quality → cost</h2></div><p>Illustrative rates only. No provider pricing is verified.</p></header><div className="responsive-table"><table><thead><tr><th>Task</th><th>Agents</th><th>Model</th><th>Input / output</th><th>Estimated cost</th><th>Quality</th><th>Latency</th><th>Confidence</th><th>Reality</th></tr></thead><tbody>{data.taskCosts.map((item) => <tr key={item.id}><th scope="row">{item.taskType}<small>{item.taskId}</small></th><td>{item.agentIds.join(" · ")}</td><td>{data.modelCandidates.find((model) => model.modelId === item.modelId)?.modelName}<small>{item.costSource}</small></td><td>{item.estimatedInputTokens.toLocaleString()} / {item.estimatedOutputTokens.toLocaleString()}</td><td><CircleDollarSign aria-hidden="true" size={11} /> ${item.estimatedCost.toFixed(4)}</td><td><Gauge aria-hidden="true" size={11} /> {item.estimatedQuality}/100</td><td>{item.latencyClass}</td><td><ConfidenceBadge compact confidence={item.confidence} /></td><td><ExecutionRealityBadge reality={item.executionReality} /></td></tr>)}</tbody></table></div></section>
      <CostAwareStrategy options={data.costAwareStrategies} strategies={strategies} />
      <BudgetSimulation plans={data.budgetPlans} candidates={data.modelCandidates} />
      <section className="roi-unavailable"><DatabaseZap aria-hidden="true" /><div><span>ROI</span><h2>{data.financialTruth.estimatedRoi.label}</h2><p>Required inputs: {data.financialTruth.estimatedRoi.inputs.join(" + ")}. Cost source: {data.financialTruth.estimatedRoi.costSource}. Revenue source: {data.financialTruth.estimatedRoi.revenueSource}.</p><ul>{data.financialTruth.estimatedRoi.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></div><ExecutionRealityBadge reality={data.financialTruth.estimatedRoi.executionReality} /></section>
    </div>
  );
}
