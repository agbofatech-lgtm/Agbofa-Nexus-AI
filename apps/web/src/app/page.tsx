import React from "react";
import Link from "next/link";
import { AuthoritativeBrandIdentity } from "@agbofa/config";

export default function LandingPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0B] px-6 py-12 text-[#FAFAFA]">
      <main className="w-full max-w-4xl text-center">
        <div className="mx-auto mb-6 flex justify-center">
          <img
            src={AuthoritativeBrandIdentity.assets.darkLogo}
            alt={AuthoritativeBrandIdentity.productName}
            className="h-16 w-auto object-contain"
          />
        </div>

        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-[#FAFAFA] sm:text-5xl">
          {AuthoritativeBrandIdentity.tagline}
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-base text-[#A0A4A8] sm:text-lg">
          {AuthoritativeBrandIdentity.description}
        </p>

        <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Link
            href="/reader"
            className="w-full rounded-md bg-[#0066CC] px-6 py-3 text-sm font-semibold text-[#FAFAFA] shadow-sm hover:bg-[#3399FF] transition-colors sm:w-auto"
          >
            Enter AI Reader Workspace →
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 border-t border-[#2E2E32] pt-8 text-left sm:grid-cols-3">
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
            <h3 className="mb-1 text-sm font-bold text-[#3399FF]">32-Agent Workforce</h3>
            <p className="text-xs text-[#A0A4A8]">
              Autonomous News Gathering, Fact-Checking, Detection, and Pipeline Orchestration.
            </p>
          </div>
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
            <h3 className="mb-1 text-sm font-bold text-[#6C5CE7]">5 Predictive Engines</h3>
            <p className="text-xs text-[#A0A4A8]">
              Story virality prediction, audience engagement optimization, and anomaly screening.
            </p>
          </div>
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
            <h3 className="mb-1 text-sm font-bold text-[#0D9040]">5 Personalization Engines</h3>
            <p className="text-xs text-[#A0A4A8]">
              Multi-strategy recommendation blending, time-decay analytics, and semantic ranking.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
