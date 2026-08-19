import type { AnalyticsData } from "@/types/business";
export function ContentAnalytics({
  categories,
}: {
  categories: AnalyticsData["categories"];
}) {
  return (
    <section className="content-analytics glass">
      <div className="business-panel-heading">
        <div>
          <span>CATEGORY SIGNALS</span>
          <h2>Content intelligence</h2>
        </div>
      </div>
      <div>
        {categories.map((c) => (
          <article key={c.label}>
            <strong>{c.label}</strong>
            <dl>
              <div>
                <dt>Engagement</dt>
                <dd>{c.engagement}%</dd>
              </div>
              <div>
                <dt>Registrations</dt>
                <dd>{c.registrations.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd>{c.confidence}%</dd>
              </div>
            </dl>
            <i>
              <b style={{ width: `${c.engagement}%` }} />
            </i>
          </article>
        ))}
      </div>
    </section>
  );
}
