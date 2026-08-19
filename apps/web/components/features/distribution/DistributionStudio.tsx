"use client";

import { CheckCircle2, LayoutTemplate, Save, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { ContentPreview } from "@/components/features/distribution/ContentPreview";
import { useDistributionAdaptation } from "@/hooks/useDistributionAdaptation";
import type {
  DistributionAccount,
  PlatformAdaptationRule,
} from "@/types/phase3-experience";

const seed =
  "African language models are moving beyond translation into practical digital infrastructure. Explore the evidence, constraints, and implications for builders across the continent.";

export function DistributionStudio({
  accounts,
  rules,
}: {
  accounts: DistributionAccount[];
  rules: PlatformAdaptationRule[];
}) {
  const [content, setContent] = useState(seed);
  const [selected, setSelected] = useState<string[]>([
    "brand-facebook",
    "brand-x",
    "brand-linkedin",
  ]);
  const [message, setMessage] = useState("");
  const targets = useMemo(
    () => accounts.filter((item) => item.scope === "BRAND" && selected.includes(item.id)),
    [accounts, selected],
  );
  const previews = useDistributionAdaptation(content, targets);
  const toggle = (id: string) => {
    setMessage("");
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };
  return (
    <div className="phase3-stack">
      <section className="studio-workbench">
        <header>
          <div><span>MASTER BRIEF</span><h2>Adapt the idea, preserve the truth</h2></div>
          <strong><Sparkles aria-hidden="true" size={13} /> deterministic templates</strong>
        </header>
        <label htmlFor="phase3-master-brief">Approved story angle</label>
        <textarea
          id="phase3-master-brief"
          maxLength={1200}
          onChange={(event) => { setContent(event.target.value); setMessage(""); }}
          value={content}
        />
        <fieldset>
          <legend>Brand destinations for structural preview</legend>
          <div className="studio-targets">
            {accounts.filter((item) => item.scope === "BRAND").map((item) => (
              <button
                aria-pressed={selected.includes(item.id)}
                key={item.id}
                onClick={() => toggle(item.id)}
                type="button"
              >
                {item.platform}<small>{item.state.replaceAll("_", " ")}</small>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="studio-actions">
          <button
            disabled={!content.trim() || !targets.length}
            onClick={() => setMessage("Local review plan saved in component state. No account was contacted and nothing was scheduled or published.")}
            type="button"
          ><Save aria-hidden="true" size={13} /> Save simulated review plan</button>
          <span aria-live="polite">{message || `${previews.length} structural previews · no provider fidelity claimed`}</span>
        </div>
      </section>

      {previews.length ? (
        <section className="studio-previews" aria-labelledby="studio-previews-title">
          <header><div><span>PLATFORM PREVIEWS</span><h2 id="studio-previews-title">Constraint-aware comparison</h2></div><LayoutTemplate aria-hidden="true" /></header>
          <div>{previews.map((preview) => <ContentPreview key={preview.channelId} preview={preview} />)}</div>
        </section>
      ) : (
        <aside className="phase3-notice"><LayoutTemplate aria-hidden="true" size={18} /><div><strong>No previews selected</strong><p>Select a brand destination and enter a brief. No connection is required for local templates.</p></div></aside>
      )}

      <section className="platform-rulebook" aria-labelledby="platform-rulebook-title">
        <header><div><span>ADAPTATION RULEBOOK</span><h2 id="platform-rulebook-title">Voice, format, ratio, CTA, discovery</h2></div><small>Preview fidelity: structural simulation</small></header>
        <div>
          {rules.map((rule) => (
            <article key={rule.platform}>
              <header><strong>{rule.platform}</strong><CheckCircle2 aria-label="Rule available" size={14} /></header>
              <dl>
                <div><dt>Voice</dt><dd>{rule.voice}</dd></div>
                <div><dt>Formats</dt><dd>{rule.formats.join(" · ")}</dd></div>
                <div><dt>Ratios</dt><dd>{rule.aspectRatios.join(" · ")}</dd></div>
                <div><dt>CTA</dt><dd>{rule.cta}</dd></div>
                <div><dt>Discovery</dt><dd>{rule.discovery}</dd></div>
                <div><dt>Truncation</dt><dd>{rule.truncation}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
