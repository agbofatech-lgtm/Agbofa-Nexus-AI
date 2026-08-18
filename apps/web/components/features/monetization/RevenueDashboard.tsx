import { CircleDollarSign, Repeat2, TrendingUp, Users } from "lucide-react";
import { BusinessMetric } from "@/components/features/business/BusinessMetric";
import { BusinessChart } from "@/components/features/business/BusinessChart";
import type { MonetizationData } from "@/types/business";
const icons = [CircleDollarSign, TrendingUp, Users, Repeat2] as const;
export function RevenueDashboard({ data }: { data: MonetizationData }) {
  return (
    <>
      <section className="business-metric-grid">
        {data.metrics.map((m, i) => (
          <BusinessMetric
            key={m.id}
            detail={`${m.change >= 0 ? "+" : ""}${m.change}% demo change`}
            icon={icons[i] ?? CircleDollarSign}
            label={m.label}
            tone={i === 3 ? "warning" : i === 2 ? "purple" : "gold"}
            value={`${m.unit === " $" ? m.unit : ""}${m.unit === "$" ? "$" : ""}${m.value.toLocaleString()}${m.unit === "%" ? "%" : ""}`}
          />
        ))}
      </section>
      <section className="business-chart-panel glass">
        <div className="business-panel-heading">
          <div>
            <span>DEMO DATA</span>
            <h2>Revenue and subscriber trajectory</h2>
          </div>
        </div>
        <BusinessChart
          data={data.revenueSeries}
          label="Demo revenue, subscribers, and churn series"
          series={[
            { key: "revenue", label: "Revenue", color: "#D4AF37" },
            { key: "subscribers", label: "Subscribers", color: "#6C5CE7" },
            { key: "churn", label: "Churn", color: "#CF2020" },
          ]}
        />
      </section>
    </>
  );
}
