import { ArrowUpRight, BrainCircuit, ShieldCheck } from "lucide-react";
import type { AIInsightData } from "@/types/operations";
export function AIInsight({ insight }: { insight: AIInsightData }) {
  const confidence = Math.min(100, Math.max(0, Math.round(insight.confidence)));
  return (
    <aside className="ai-insight" aria-labelledby="ai-insight-title">
      <div className="ai-insight__mark" aria-hidden="true">
        <BrainCircuit size={20} />
      </div>
      <div className="ai-insight__body">
        <span>AI insight · development analysis</span>
        <h2 id="ai-insight-title">{insight.title}</h2>
        <p>{insight.summary}</p>
        <div className="ai-insight__confidence">
          <span>
            <ShieldCheck size={13} /> Confidence
          </span>
          <strong>{confidence}%</strong>
          <i>
            <b style={{ width: `${confidence}%` }} />
          </i>
        </div>
        <div className="ai-insight__reasoning">
          <strong>Why</strong>
          <ul>
            {insight.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="ai-insight__action">
          <span>
            <ArrowUpRight size={14} /> Recommended next action
          </span>
          <strong>{insight.recommendation}</strong>
          <small>{insight.caveat}</small>
        </div>
      </div>
    </aside>
  );
}
