import {
  ArrowUpRight,
  FileCheck2,
  Files,
  PackageCheck,
  Send,
} from "lucide-react";

import { Skeleton } from "@/components/ui";
import type { NewsroomMetric } from "@/types/newsroom";

const metricIcons = {
  total: Files,
  review: FileCheck2,
  published: Send,
  packages: PackageCheck,
} as const;

interface NewsroomStatsProps {
  metrics: NewsroomMetric[];
  loading?: boolean;
}

export function NewsroomStats({
  metrics,
  loading = false,
}: NewsroomStatsProps) {
  if (loading) {
    return (
      <div className="newsroom-stats" aria-label="Loading newsroom statistics">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="newsroom-stat glass">
            <Skeleton height={34} width={52} />
            <Skeleton height={10} width="70%" />
            <Skeleton height={8} width="40%" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section aria-label="Newsroom statistics" className="newsroom-stats">
      {metrics.map((metric) => {
        const Icon =
          metricIcons[metric.id as keyof typeof metricIcons] ?? Files;
        return (
          <div
            key={metric.id}
            className={`newsroom-stat newsroom-stat--${metric.tone} glass-card`}
          >
            <span className="newsroom-stat__icon">
              <Icon size={18} />
            </span>
            <div>
              <strong>{metric.value.toLocaleString()}</strong>
              <span>{metric.label}</span>
            </div>
            <small>
              <ArrowUpRight size={12} /> {metric.change}% this week
            </small>
          </div>
        );
      })}
    </section>
  );
}
