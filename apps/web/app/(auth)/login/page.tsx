import type { Metadata } from "next";
import { Activity, Globe2, ShieldCheck, Sparkles } from "lucide-react";

import { LoginForm } from "@/components/features/public/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Secure tenant access to the Agbofa Nexus AI workspace.",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

function safeNextPath(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate?.startsWith("/") && !candidate.startsWith("//")
    ? candidate
    : "/dashboard";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);

  return (
    <div className="login-page">
      <aside className="login-story" aria-label="Nexus platform promise">
        <div className="login-story__glow" />
        <span className="section-kicker">
          <Sparkles size={13} /> Intelligence with integrity
        </span>
        <h2>
          Your newsroom.
          <br />
          <span>Exponentially smarter.</span>
        </h2>
        <p>
          Command a transparent AI workforce built to discover the signal,
          verify every claim, and turn trusted intelligence into impact.
        </p>
        <div className="login-story__signals">
          <div>
            <Activity size={18} />
            <span>
              <strong>32 agents</strong>
              <small>Visible and accountable</small>
            </span>
          </div>
          <div>
            <ShieldCheck size={18} />
            <span>
              <strong>Evidence first</strong>
              <small>Confidence on every claim</small>
            </span>
          </div>
          <div>
            <Globe2 size={18} />
            <span>
              <strong>Ghana to global</strong>
              <small>Context without borders</small>
            </span>
          </div>
        </div>
      </aside>
      <section className="login-panel glass-dark">
        <LoginForm nextPath={nextPath} />
      </section>
    </div>
  );
}
