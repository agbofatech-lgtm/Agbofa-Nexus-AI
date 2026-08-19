import { AlertTriangle, Check, Circle, LoaderCircle } from "lucide-react";

import { Skeleton } from "@/components/ui";
import type { IngestionStage } from "@/types/newsroom";

interface IngestionPipelineProps {
  stages: IngestionStage[];
  loading?: boolean;
}

const stageIcons = {
  complete: Check,
  active: LoaderCircle,
  warning: AlertTriangle,
  pending: Circle,
} as const;

export function IngestionPipeline({
  stages,
  loading = false,
}: IngestionPipelineProps) {
  return (
    <section
      className="ingestion-pipeline glass"
      aria-labelledby="pipeline-title"
    >
      <div className="ingestion-pipeline__heading">
        <div>
          <span className="section-kicker">Source operations model</span>
          <h2 id="pipeline-title">Ingestion pipeline</h2>
        </div>
        <span>
          {loading
            ? "Synchronizing…"
            : `${stages.at(-1)?.processed.toLocaleString() ?? 0} items routed`}
        </span>
      </div>
      {loading ? (
        <Skeleton height={100} rounded="lg" />
      ) : (
        <ol className="pipeline-track">
          {stages.map((stage, index) => {
            const Icon = stageIcons[stage.status];
            return (
              <li
                key={stage.id}
                className={`pipeline-stage pipeline-stage--${stage.status}`}
              >
                <span className="pipeline-stage__icon">
                  <Icon size={16} />
                </span>
                <strong>{stage.label}</strong>
                <small>{stage.processed.toLocaleString()} items</small>
                <b>{stage.latencyMs ? `${stage.latencyMs}ms` : "Waiting"}</b>
                {index < stages.length - 1 ? <i /> : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
