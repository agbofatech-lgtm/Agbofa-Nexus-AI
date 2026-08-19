import type { Metadata } from "next";

import { LandingCapabilities } from "@/components/features/public/LandingCapabilities";
import { LandingHero } from "@/components/features/public/LandingHero";
import { LandingWorkflow } from "@/components/features/public/LandingWorkflow";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <div className="landing-page">
      <LandingHero />
      <LandingCapabilities />
      <LandingWorkflow />
      <section className="landing-final-cta glass-gold">
        <span className="section-kicker">The future is already signaling</span>
        <h2>Read deeper. Decide faster. Build what comes next.</h2>
        <p>
          Enter the AI Reader Workspace and experience news with evidence,
          context, and confidence built in.
        </p>
        <a className="landing-cta__primary" href="/login">
          Enter AI Reader Workspace <span aria-hidden="true">→</span>
        </a>
      </section>
    </div>
  );
}
