import { Activity, BrainCircuit, Target, Users } from "lucide-react";

import { IntelligenceMetricCard } from "@/components/features/intelligence/IntelligenceMetricCard";
import type { ReaderProfileMetric } from "@/types/personalization-intelligence";

const icons = [Users, BrainCircuit, Activity, Target] as const;
const tones = ["gold", "blue", "purple", "green"] as const;

export function PersonalizationStats({
  metrics,
}: {
  metrics: ReaderProfileMetric[];
}) {
  return (
    <section className="intelligence-metric-grid">
      {metrics.map((metric, index) => (
        <IntelligenceMetricCard
          key={metric.id}
          detail={`${metric.change >= 0 ? "+" : ""}${metric.change}% sample change`}
          icon={icons[index] ?? Target}
          label={metric.label}
          tone={tones[index] ?? "gold"}
          value={`${metric.value.toLocaleString()}${metric.unit}`}
        />
      ))}
    </section>
  );
}
