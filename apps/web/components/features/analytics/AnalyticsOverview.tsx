import { Activity, BarChart3, CircleDollarSign, Users } from "lucide-react";
import { BusinessMetric } from "@/components/features/business/BusinessMetric";
import type { AnalyticsData } from "@/types/business";
const icons = [Users, BarChart3, Activity, CircleDollarSign] as const;
export function AnalyticsOverview({
  items,
}: {
  items: AnalyticsData["overview"];
}) {
  return (
    <section className="business-metric-grid">
      {items.map((m, i) => (
        <BusinessMetric
          key={m.id}
          detail={`${m.change >= 0 ? "+" : ""}${m.change}% demo change`}
          icon={icons[i] ?? Activity}
          label={m.label}
          tone={
            i === 1 ? "blue" : i === 2 ? "purple" : i === 3 ? "green" : "gold"
          }
          value={`${m.unit === "$" ? "$" : ""}${m.value.toLocaleString()}${m.unit === "%" ? "%" : ""}`}
        />
      ))}
    </section>
  );
}
