import type { Metadata } from "next";
import { Activity, Globe2, ShieldCheck, Sparkles } from "lucide-react";

import { LoginForm } from "@/components/features/public/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Secure tenant access to the Agbofa Nexus AI workspace.",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{
    next?: string | string[];
    reason?: string | string[];
  }>;
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
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const sessionExpired = reason === "session-expired";

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
          Explore a transparent frontend demonstration built to discover the
          signal, inspect evidence, and turn intelligence into editorial action.
        </p>
        <div className="login-story__signals">
          <div>
            <Activity size={18} />
            <span>
              <strong>28 agent definitions</strong>
              <small>Visible demo registry</small>
            </span>
          </div>
          <div>
            <ShieldCheck size={18} />
            <span>
              <strong>Evidence first</strong>
              <small>Inspectable confidence UX</small>
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
        <LoginForm nextPath={nextPath} sessionExpired={sessionExpired} />
      </section>
    </div>
  );
}
