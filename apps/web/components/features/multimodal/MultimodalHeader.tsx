import { DemoDataBanner } from "@/components/features/intelligence/DemoDataBanner";
import { IntelligenceHeader } from "@/components/features/intelligence/IntelligenceHeader";

export function MultimodalHeader() {
  return (
    <>
      <IntelligenceHeader
        eyebrow="IMP-020 · Media intelligence"
        subtitle="Inspect image, video, audio, and cross-media relationships through a professional demo processing workspace."
        title="Multimodal Intelligence"
      />
      <DemoDataBanner
        partial
        label="DEMO PROCESSING"
        message="No upload or multimodal analysis endpoint exists. Files remain in the browser and analysis is simulated."
      />
    </>
  );
}
