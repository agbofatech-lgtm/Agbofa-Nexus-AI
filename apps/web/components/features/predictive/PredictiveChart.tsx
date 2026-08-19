"use client";

import { IntelligenceChart } from "@/components/features/intelligence/IntelligenceChart";
import type { PredictionPoint } from "@/types/predictive";

export function PredictiveChart({ series }: { series: PredictionPoint[] }) {
  const data = series.map((point) => ({ ...point }));
  return (
    <section className="predictive-chart-panel glass">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">Example time series</span>
          <h2>Prediction trajectory</h2>
        </div>
        <span>12 sample intervals</span>
      </div>
      <IntelligenceChart
        data={data}
        label="Demo virality, engagement, confidence, and topic velocity trends"
        series={[
          { key: "virality", label: "Virality", color: "var(--chart-gold)" },
          {
            key: "engagement",
            label: "Engagement",
            color: "var(--chart-purple)",
          },
          {
            key: "confidence",
            label: "Confidence",
            color: "var(--chart-green)",
          },
          {
            key: "velocity",
            label: "Topic velocity",
            color: "var(--chart-blue)",
          },
        ]}
      />
    </section>
  );
}
