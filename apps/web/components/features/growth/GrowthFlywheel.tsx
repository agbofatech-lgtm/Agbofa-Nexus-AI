import { ArrowRight } from "lucide-react";
export function GrowthFlywheel({ stages }: { stages: string[] }) {
  return (
    <section className="growth-flywheel glass">
      <div className="business-panel-heading">
        <div>
          <span>DEMO OPERATING MODEL</span>
          <h2>Growth flywheel</h2>
        </div>
      </div>
      <ol>
        {stages.map((stage, index) => (
          <li key={stage}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{stage}</strong>
            {index < stages.length - 1 ? <ArrowRight size={13} /> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
