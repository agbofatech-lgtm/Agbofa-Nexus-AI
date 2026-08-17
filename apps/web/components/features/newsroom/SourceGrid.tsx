import { DatabaseZap } from "lucide-react";

import { SourceCard } from "@/components/features/newsroom/SourceCard";
import { Skeleton } from "@/components/ui";
import type { NewsSource, SourceStatus } from "@/types/newsroom";

interface SourceGridProps {
  sources: NewsSource[];
  filter: SourceStatus | "all";
  loading?: boolean;
}

export function SourceGrid({
  sources,
  filter,
  loading = false,
}: SourceGridProps) {
  if (loading) {
    return (
      <div className="source-grid" aria-label="Loading sources">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="source-card glass">
            <Skeleton height={40} width="70%" />
            <Skeleton height={10} />
            <Skeleton height={10} />
            <Skeleton height={6} />
          </div>
        ))}
      </div>
    );
  }
  const visible =
    filter === "all"
      ? sources
      : sources.filter((source) => source.status === filter);
  if (!visible.length) {
    return (
      <div className="newsroom-empty glass">
        <DatabaseZap size={24} />
        <div>
          <strong>No sources match this status.</strong>
          <p>Choose another source health filter to continue.</p>
        </div>
      </div>
    );
  }
  return (
    <section aria-label={`${filter} sources`} className="source-grid">
      {visible.map((source) => (
        <SourceCard key={source.id} source={source} />
      ))}
    </section>
  );
}
