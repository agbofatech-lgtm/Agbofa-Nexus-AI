import type { GrowthData } from "@/types/business";
export function AudienceFunnel({ funnel }: { funnel: GrowthData["funnel"] }) {
  const max = funnel[0]?.value ?? 1;
  return (
    <section className="audience-funnel glass">
      <div className="business-panel-heading">
        <div>
          <span>DEMO DATA</span>
          <h2>Audience hierarchy</h2>
        </div>
      </div>
      <div>
        {funnel.map((item) => (
          <article
            key={item.stage}
            style={{ width: `${Math.max(34, (item.value / max) * 100)}%` }}
          >
            <span>{item.stage}</span>
            <strong>{item.value.toLocaleString()}</strong>
            <small>{item.conversion}% step conversion</small>
          </article>
        ))}
      </div>
    </section>
  );
}
