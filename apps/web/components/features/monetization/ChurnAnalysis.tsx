import { AlertTriangle, Repeat2 } from "lucide-react";
export function ChurnAnalysis() {
  return (
    <section className="churn-analysis glass">
      <div className="business-panel-heading">
        <div>
          <span>DEMO ANALYSIS</span>
          <h2>Churn intelligence</h2>
        </div>
        <Repeat2 size={17} />
      </div>
      <div>
        <strong>3.8%</strong>
        <span>example monthly churn</span>
      </div>
      <ul>
        <li>
          <AlertTriangle size={12} />
          Possible driver: first-week onboarding completion
        </li>
        <li>
          <AlertTriangle size={12} />
          Potential opportunity: evidence explorer education
        </li>
        <li>
          <AlertTriangle size={12} />
          Backend cohort data required for causal claims
        </li>
      </ul>
    </section>
  );
}
