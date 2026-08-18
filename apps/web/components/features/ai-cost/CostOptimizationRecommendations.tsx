import { Lightbulb } from "lucide-react";
import type { AICostData } from "@/types/business";
export function CostOptimizationRecommendations({
  items,
}: {
  items: AICostData["recommendations"];
}) {
  return (
    <section className="cost-recommendations glass">
      <div className="business-panel-heading">
        <div>
          <span>POTENTIAL OPTIMIZATIONS</span>
          <h2>Cost recommendations</h2>
        </div>
        <Lightbulb size={17} />
      </div>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <span>
              <Lightbulb size={14} />
            </span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.action}</p>
              <small>{item.confidence}</small>
            </div>
            <b>Savings: {item.savings}</b>
          </li>
        ))}
      </ol>
    </section>
  );
}
