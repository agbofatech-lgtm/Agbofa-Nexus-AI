import { Skeleton } from "@/components/ui";

interface AgentSkeletonProps {
  count?: number;
  detail?: boolean;
}

export function AgentSkeleton({
  count = 8,
  detail = false,
}: AgentSkeletonProps) {
  if (detail) {
    return (
      <div className="agent-detail-skeleton" aria-label="Loading agent detail">
        <Skeleton height={45} width="58%" />
        <div>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} height={115} rounded="lg" />
          ))}
        </div>
        <Skeleton height={300} rounded="lg" />
        <Skeleton height={360} rounded="lg" />
      </div>
    );
  }
  return (
    <div className="agent-grid" aria-label="Loading agents">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="agent-card glass">
          <Skeleton height={18} width="32%" />
          <Skeleton height={24} width="76%" />
          <Skeleton height={10} />
          <Skeleton height={7} />
          <div className="agent-skeleton-metrics">
            {Array.from({ length: 4 }, (_, metric) => (
              <Skeleton key={metric} height={38} rounded="md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
