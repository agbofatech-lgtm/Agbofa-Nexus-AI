import { Clock3, Film, ScanFace, TextQuote } from "lucide-react";

import type { VideoAnalysis as VideoData } from "@/types/multimodal";

export function VideoAnalysis({ analysis }: { analysis: VideoData }) {
  return (
    <section className="media-analysis glass">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">
            <Film size={12} /> Sample analysis
          </span>
          <h2>Video intelligence</h2>
        </div>
        <strong>{analysis.confidence}% confidence</strong>
      </div>
      <div className="video-analysis-stats">
        <span>
          <Film size={14} />
          <b>{analysis.scenes}</b> scenes
        </span>
        <span>
          <Clock3 size={14} />
          <b>{analysis.durationSeconds}s</b> duration
        </span>
        <span>
          <ScanFace size={14} />
          <b>{analysis.entities.length}</b> entities
        </span>
      </div>
      <article>
        <h3>
          <TextQuote size={13} /> Demo transcript
        </h3>
        <p>{analysis.transcript}</p>
      </article>
      <div className="keyframe-list">
        {analysis.keyframes.map((frame, index) => (
          <span key={frame}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            {frame}
          </span>
        ))}
      </div>
    </section>
  );
}
