import { FileText, ScanSearch, ShieldCheck, Tags } from "lucide-react";

import type { ImageAnalysis as ImageData } from "@/types/multimodal";

export function ImageAnalysis({ analysis }: { analysis: ImageData }) {
  return (
    <section className="media-analysis glass">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">
            <ScanSearch size={12} /> Sample analysis
          </span>
          <h2>Image intelligence</h2>
        </div>
        <strong>{analysis.confidence}% confidence</strong>
      </div>
      <div className="media-analysis-grid">
        <article>
          <h3>
            <Tags size={13} /> Objects
          </h3>
          <div>
            {analysis.objects.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>
        <article>
          <h3>
            <FileText size={13} /> OCR
          </h3>
          <ul>
            {analysis.ocr.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>
            <ScanSearch size={13} /> Entities
          </h3>
          <div>
            {analysis.entities.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>
        <article>
          <h3>
            <ShieldCheck size={13} /> Authenticity indicator
          </h3>
          <strong>{analysis.authenticity}%</strong>
          <i>
            <b style={{ width: `${analysis.authenticity}%` }} />
          </i>
        </article>
      </div>
      <dl>
        {Object.entries(analysis.metadata).map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
