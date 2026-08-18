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
          <span>DEMO DATA</span>
          <h2>Cross-module performance</h2>
        </div>
      </div>
      <BusinessChart
        data={series}
        label="Demo audience, content, distribution, growth, revenue, and AI performance"
        series={[
          { key: "audience", label: "Audience", color: "#3399FF" },
          { key: "content", label: "Content", color: "#D4AF37" },
          { key: "distribution", label: "Distribution", color: "#8B5CF6" },
          { key: "growth", label: "Growth", color: "#0D9040" },
          { key: "revenue", label: "Revenue", color: "#F59E0B" },
          { key: "ai", label: "AI", color: "#6C5CE7" },
        ]}
      />
    </section>
  );
}
