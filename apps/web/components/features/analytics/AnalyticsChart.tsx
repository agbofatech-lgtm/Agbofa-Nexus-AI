import { BusinessChart } from "@/components/features/business/BusinessChart";
import type { AnalyticsData } from "@/types/business";
export function AnalyticsChart({
  series,
}: {
  series: AnalyticsData["series"];
}) {
  return (
    <section className="business-chart-panel glass">
      <div className="business-panel-heading">
        <div>
          <span>CROSS-MODULE VIEW</span>
          <h2>Cross-module performance</h2>
        </div>
      </div>
      <BusinessChart
        data={series}
        label="Demo audience, content, distribution, growth, revenue, and AI performance"
        series={[
          { key: "audience", label: "Audience", color: "var(--chart-blue)" },
          { key: "content", label: "Content", color: "var(--chart-gold)" },
          {
            key: "distribution",
            label: "Distribution",
            color: "var(--chart-purple)",
          },
          { key: "growth", label: "Growth", color: "var(--chart-green)" },
          { key: "revenue", label: "Revenue", color: "var(--chart-warning)" },
          { key: "ai", label: "AI", color: "var(--chart-purple)" },
        ]}
      />
    </section>
  );
}
