import { Sparkles } from "lucide-react";
export function GrowthRecommendations({ items }: { items: string[] }) {
  return (
    <section className="growth-recommendations glass">
      <div className="business-panel-heading">
        <div>
          <span>DEMO INSIGHTS</span>
          <h2>AI growth recommendations</h2>
        </div>
      </div>
      <ol>
        {items.map((item, index) => (
          <li key={item}>
            <span>
              <Sparkles size={14} />
            </span>
            <div>
              <strong>Potential opportunity {index + 1}</strong>
              <p>{item}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
