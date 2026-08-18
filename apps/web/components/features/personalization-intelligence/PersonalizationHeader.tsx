import { DemoDataBanner } from "@/components/features/intelligence/DemoDataBanner";
import { IntelligenceHeader } from "@/components/features/intelligence/IntelligenceHeader";

export function PersonalizationHeader() {
  return (
    <>
      <IntelligenceHeader
        eyebrow="IMP-019 · Reader intelligence"
        subtitle="Inspect example reader profiles, recommendation performance, feed behavior, and topic affinity while preserving the existing Reader personalization system."
        title="Personalization Intelligence"
      />
      <DemoDataBanner
        partial
        message="Profile and performance metrics are sample analysis. Preference controls persist only in frontend local state."
      />
    </>
  );
}
