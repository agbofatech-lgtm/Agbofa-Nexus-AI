import { CircleDollarSign, Scale } from "lucide-react";
import { StrategyRiskBadge } from "@/components/features/strategy/StrategyRiskBadge";
import type { StrategyDirectorPlan } from "@/types/strategy-director";

export function StrategyCostRiskMatrix({ plans }: { plans: StrategyDirectorPlan[] }) {
  return (
    <section className="strategy-cost-risk" aria-labelledby="cost-risk-title">
      <header><div><span>COST & RISK VISIBILITY</span><h2 id="cost-risk-title">Estimated effort, simulated risk</h2></div><p>No value is actual spend and no risk comes from an authoritative risk engine.</p></header>
      <div className="responsive-table">
        <table>
          <thead><tr><th>Strategy / initiative</th><th>Estimated cost</th><th>Risk</th><th>Rationale</th><th>Confidence</th></tr></thead>
          <tbody>{plans.flatMap((plan) => [
            <tr className="strategy-cost-risk__plan" key={plan.id}><th scope="row"><Scale aria-hidden="true" size={12} /> {plan.title}</th><td><CircleDollarSign aria-hidden="true" size={11} /> ${plan.estimatedCost.amount?.toLocaleString()}</td><td><StrategyRiskBadge risk={plan.risk} /></td><td>{plan.risk.rationale}</td><td>{plan.confidence.score}%</td></tr>,
            ...plan.initiatives.map((initiative) => <tr key={initiative.id}><th scope="row">↳ {initiative.title}</th><td>${initiative.estimatedCost.amount?.toLocaleString()} estimated</td><td><StrategyRiskBadge risk={initiative.risk} /></td><td>{initiative.risk.rationale}</td><td>{initiative.confidence.score}%</td></tr>),
          ])}</tbody>
        </table>
      </div>
    </section>
  );
}
