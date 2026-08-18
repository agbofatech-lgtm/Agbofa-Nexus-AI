import { Lightbulb } from "lucide-react";
export function BusinessInsights({ items }: { items: string[] }) {
  return (
    <section className="business-insights glass-gold">
      <div className="business-panel-heading">
        <div>
          <span>POSSIBLE DRIVERS · DEMO</span>
          <h2>What matters next</h2>
        </div>
        <Lightbulb size={17} />
      </div>
      <ol>
        {items.map((item, index) => (
          <li key={item}>
            <span>{index + 1}</span>
            <p>{item}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
