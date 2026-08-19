import { BrainCircuit, Sparkles } from "lucide-react";

import { Skeleton } from "@/components/ui";

export interface AISummaryProps {
  summary: string;
  loading?: boolean;
}

export function AISummary({ summary, loading = false }: AISummaryProps) {
  return (
    <section
      className="ai-summary glass"
      aria-busy={loading}
      aria-labelledby="ai-summary-title"
    >
      <div className="ai-summary__icon">
        <BrainCircuit size={21} />
      </div>
      <div>
        <span className="section-kicker">
          <Sparkles size={12} /> Nexus synthesis
        </span>
        <h2 id="ai-summary-title">AI Summary</h2>
        {loading ? (
          <div className="ai-summary__skeletons">
            <Skeleton height={10} rounded="full" />
            <Skeleton height={10} rounded="full" width="92%" />
            <Skeleton height={10} rounded="full" width="74%" />
          </div>
        ) : (
          <p>{summary}</p>
        )}
        <small>
          Generated from the article and its verification context. Review
          sources before acting.
        </small>
      </div>
    </section>
  );
}
