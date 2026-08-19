import { Clock3, Languages, Mic2, TextQuote } from "lucide-react";

import type { AudioAnalysis as AudioData } from "@/types/multimodal";

export function AudioAnalysis({ analysis }: { analysis: AudioData }) {
  return (
    <section className="media-analysis glass">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">
            <Mic2 size={12} /> Sample analysis
          </span>
          <h2>Audio intelligence</h2>
        </div>
        <strong>{analysis.confidence}% confidence</strong>
      </div>
      <div className="video-analysis-stats">
        <span>
          <Mic2 size={14} />
          <b>{analysis.speakers}</b> speakers
        </span>
        <span>
          <Languages size={14} />
          <b>{analysis.language}</b>
        </span>
        <span>
          <Clock3 size={14} />
          <b>{analysis.durationSeconds}s</b> duration
        </span>
      </div>
      <article>
        <h3>
          <TextQuote size={13} /> Demo transcript
        </h3>
        <p>{analysis.transcript}</p>
      </article>
    </section>
  );
}
