import { ArrowRight, BrainCircuit, Radar, Sparkles } from "lucide-react";
import { DataSourceIndicator } from "@/components/shared/data/DataSourceIndicator";
import { createDataProvenance } from "@/types/data-state";
const provenance = createDataProvenance(
  "mock",
  "Story intelligence development adapter",
  "Implications and outlook are deterministic editorial development content. Predictions are possibilities, not facts.",
);
export function StoryIntelligence({
  whyItMatters,
  keySignals,
  outlook,
  confidence,
}: {
  whyItMatters: string;
  keySignals: readonly string[];
  outlook: readonly string[];
  confidence: number;
}) {
  return (
    <section
      className="story-intelligence"
      aria-labelledby="story-intelligence-title"
    >
      <header>
        <div>
          <span>
            <BrainCircuit size={13} /> Story intelligence
          </span>
          <h2 id="story-intelligence-title">Why this matters</h2>
        </div>
        <DataSourceIndicator details provenance={provenance} />
      </header>
      <p className="story-intelligence__why">{whyItMatters}</p>
      <div className="story-intelligence__grid">
        <section aria-labelledby="key-signals-title">
          <span>
            <Radar size={14} /> Evidence-aware context
          </span>
          <h3 id="key-signals-title">Key signals</h3>
          <ul>
            {keySignals.map((s) => (
              <li key={s}>
                <ArrowRight aria-hidden="true" size={13} />
                {s}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="outlook-title">
          <span>
            <Sparkles size={14} /> Predictive context
          </span>
          <h3 id="outlook-title">What happens next?</h3>
          <ol>
            {outlook.map((o, i) => (
              <li key={o}>
                <b>{i + 1}</b>
                <span>{o}</span>
              </li>
            ))}
          </ol>
          <div className="story-intelligence__confidence">
            <span>Development confidence</span>
            <strong>{confidence}%</strong>
            <i>
              <b style={{ width: `${confidence}%` }} />
            </i>
          </div>
          <small>
            Possible outcomes, not factual predictions or guarantees.
          </small>
        </section>
      </div>
    </section>
  );
}
