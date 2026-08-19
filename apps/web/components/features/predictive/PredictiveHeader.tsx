import { DemoDataBanner } from "@/components/features/intelligence/DemoDataBanner";
import { IntelligenceHeader } from "@/components/features/intelligence/IntelligenceHeader";

export function PredictiveHeader() {
  return (
    <>
      <IntelligenceHeader
        eyebrow="IMP-018 · Example predictions"
        subtitle="Understand likely reach, engagement, topic velocity, and editorial optimization—without presenting demo forecasts as live results."
        title="Predictive Intelligence"
      />
      <DemoDataBanner message="Predictions are deterministic frontend examples. No predictive backend endpoint was found." />
    </>
  );
}
