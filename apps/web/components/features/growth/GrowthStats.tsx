import { Activity, MousePointerClick, Repeat2, Users } from "lucide-react";
import { BusinessMetric } from "@/components/features/business/BusinessMetric";
import type { GrowthData } from "@/types/business";
const icons = [Users, MousePointerClick, Activity, Repeat2] as const;
export function GrowthStats({ metrics }: { metrics: GrowthData["metrics"] }) {
  return (
    <section className="business-metric-grid">
      {metrics.map((m, i) => (
        <BusinessMetric
          key={m.id}
          detail={`${m.change >= 0 ? "+" : ""}${m.change}% demo change`}
          icon={icons[i] ?? Activity}
          label={m.label}
          tone={
            i === 1 ? "blue" : i === 2 ? "purple" : i === 3 ? "green" : "gold"
          }
          value={`${m.value.toLocaleString()}${m.unit}`}
        />
      ))}
    </section>
  );
}
