import { Activity, Files, ShieldCheck, Workflow } from "lucide-react";

import { IntelligenceMetricCard } from "@/components/features/intelligence/IntelligenceMetricCard";
import type { AgentSummary } from "@/types/agents";
import type { MultimodalWorkspaceData } from "@/types/multimodal";

export function MultimodalStats({
  data,
  agentSummary,
  executionCount,
}: {
  data: MultimodalWorkspaceData;
  agentSummary: AgentSummary;
  executionCount: number;
}) {
  return (
    <section className="intelligence-metric-grid">
      <IntelligenceMetricCard
        detail="Sample processing volume"
        icon={Files}
        label="Processed today"
        value={data.processedToday.toLocaleString()}
      />
      <IntelligenceMetricCard
        detail="Across sample analyses"
        icon={ShieldCheck}
        label="Average confidence"
        tone="green"
        value={`${data.averageConfidence}%`}
      />
      <IntelligenceMetricCard
        detail="Simulated agent executions considered"
        icon={Activity}
        label="Execution context"
        tone="purple"
        value={String(executionCount)}
      />
      <IntelligenceMetricCard
        detail="Canonical workforce demo health"
        icon={Workflow}
        label="Agent health input"
        tone="blue"
        value={`${agentSummary.averageHealth}%`}
      />
    </section>
  );
}
