import { DemoDataBanner } from "@/components/features/intelligence/DemoDataBanner";
import { IntelligenceHeader } from "@/components/features/intelligence/IntelligenceHeader";

export function AIControlHeader() {
  return (
    <>
      <IntelligenceHeader
        eyebrow="Provider operations"
        subtitle="Understand example provider availability, model routing, usage, fallback posture, and workforce health without exposing credentials."
        title="AI Control Center"
      />
      <DemoDataBanner
        partial
        message="Provider connections, requests, tokens, cost, and health are sample operations data. No API keys or live provider calls exist in this frontend."
      />
    </>
  );
}
