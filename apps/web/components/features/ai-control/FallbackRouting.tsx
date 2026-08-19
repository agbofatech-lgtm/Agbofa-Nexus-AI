import { ArrowRight, Route } from "lucide-react";

import type { AIProvider } from "@/types/ai-control";

export function FallbackRouting({ providers }: { providers: AIProvider[] }) {
  return (
    <section className="fallback-routing glass">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">
            <Route size={12} /> Demo routing posture
          </span>
          <h2>Fallback visualization</h2>
        </div>
      </div>
      <div>
        {providers.map((provider, index) => (
          <div key={provider.id}>
            <span>{index + 1}</span>
            <div>
              <strong>{provider.name}</strong>
              <small>
                {provider.state} · {provider.fallbackState}
              </small>
            </div>
            {index < providers.length - 1 ? <ArrowRight size={15} /> : null}
          </div>
        ))}
      </div>
      <p>
        No provider credentials, allowlists, or routing rules are present in
        frontend source.
      </p>
    </section>
  );
}
