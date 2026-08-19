import { ArrowRight } from "lucide-react";

const workflow = [
  ["01", "Discover"],
  ["02", "Verify"],
  ["03", "Understand"],
  ["04", "Create"],
  ["05", "Distribute"],
  ["06", "Optimize"],
] as const;

export function LandingWorkflow() {
  return (
    <section
      className="landing-workflow"
      id="workflow"
      aria-labelledby="workflow-title"
    >
      <div className="public-section-heading public-section-heading--centered">
        <div>
          <span className="section-kicker">A continuous intelligence loop</span>
          <h2 id="workflow-title">From signal to impact.</h2>
        </div>
        <p>
          Every stage is observable, evidence-aware, and designed for meaningful
          human control.
        </p>
      </div>
      <ol className="workflow-track">
        {workflow.map(([number, label], index) => (
          <li key={label}>
            <span>{number}</span>
            <strong>{label}</strong>
            {index < workflow.length - 1 ? (
              <ArrowRight aria-hidden="true" size={15} />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
