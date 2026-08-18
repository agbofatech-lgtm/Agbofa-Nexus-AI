import type { GrowthData } from "@/types/business";
export function CampaignManager({
  campaigns,
}: {
  campaigns: GrowthData["campaigns"];
}) {
  return (
    <section className="growth-list glass">
      <div className="business-panel-heading">
        <div>
          <span>FRONTEND DEMO</span>
          <h2>Campaign manager</h2>
        </div>
      </div>
      {campaigns.map((c) => (
        <article key={c.id}>
          <span>{c.status}</span>
          <div>
            <strong>{c.name}</strong>
            <small>
              {c.channel} · {c.objective}
            </small>
          </div>
          <p>{c.result}</p>
        </article>
      ))}
    </section>
  );
}
