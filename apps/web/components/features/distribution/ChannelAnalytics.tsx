import { BusinessChart } from "@/components/features/business/BusinessChart";
import type { DistributionData } from "@/types/business";
export function ChannelAnalytics({
  data,
}: {
  data: DistributionData["demoAnalytics"];
}) {
  return (
    <section className="business-chart-panel glass">
      <div className="business-panel-heading">
        <div>
          <span>DEVELOPMENT COMPARISON</span>
          <h2>Brand vs personal funnel example</h2>
        </div>
        <b>NOT AUTHORITATIVE</b>
      </div>
      <BusinessChart
        data={data}
        label="Demo brand versus personal channel funnel"
        series={[
          { key: "brand", label: "Brand", color: "var(--chart-blue)" },
          { key: "personal", label: "Personal", color: "var(--chart-purple)" },
        ]}
        type="bar"
      />
    </section>
  );
}
