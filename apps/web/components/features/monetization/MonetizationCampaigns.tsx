import type { MonetizationData } from "@/types/business";
export function MonetizationCampaigns({
  campaigns,
}: {
  campaigns: MonetizationData["campaigns"];
}) {
  return (
    <section className="monetization-list glass">
      <div className="business-panel-heading">
        <div>
          <span>DEMO DATA</span>
          <h2>Campaign management</h2>
        </div>
      </div>
      {campaigns.map((c) => (
        <article key={c.id}>
          <span>{c.status}</span>
          <div>
            <strong>{c.name}</strong>
            <small>{c.offer}</small>
          </div>
          <b>{c.conversion}% demo conversion</b>
        </article>
      ))}
    </section>
  );
}
