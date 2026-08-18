import { BusinessChart } from "@/components/features/business/BusinessChart";
import type { AICostData } from "@/types/business";
export function UsageForecast({ data }: { data: AICostData["forecast"] }) {
  return (
    <section className="business-chart-panel glass">
      <div className="business-panel-heading">
        <div>
          <span>DEMO FORECAST</span>
          <h2>Usage cost forecast</h2>
        </div>
        <b>Not actual spend</b>
      </div>
      <BusinessChart
        data={data}
        label="Demo historical, current, and forecast AI cost"
        series={[
          { key: "historical", label: "Historical demo", color: "#3399FF" },
          { key: "current", label: "Current demo", color: "#D4AF37" },
          { key: "forecast", label: "Forecast", color: "#8B5CF6" },
          { key: "confidence", label: "Confidence", color: "#0D9040" },
        ]}
      />
    </section>
  );
}
