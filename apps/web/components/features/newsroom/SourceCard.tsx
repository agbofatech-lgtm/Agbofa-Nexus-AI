import { Activity, Clock3, Database, MapPin } from "lucide-react";

import { Badge } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils/reader";
import type { NewsSource } from "@/types/newsroom";

interface SourceCardProps {
  source: NewsSource;
}

const statusBadge = {
  active: "running",
  degraded: "degraded",
  inactive: "disabled",
} as const;

export function SourceCard({ source }: SourceCardProps) {
  return (
    <article
      className={`source-card source-card--${source.status} glass-card`}
      tabIndex={0}
    >
      <div className="source-card__heading">
        <span className="source-card__mark">{source.initials}</span>
        <div>
          <strong>{source.name}</strong>
          <span>{source.type}</span>
        </div>
        <Badge status={statusBadge[source.status]}>{source.status}</Badge>
      </div>
      <div className="source-card__metrics">
        <div>
          <Clock3 size={13} />
          <span>
            <small>Last ingestion</small>
            <strong>{formatRelativeTime(source.lastIngestion)}</strong>
          </span>
        </div>
        <div>
          <Database size={13} />
          <span>
            <small>Items today</small>
            <strong>{source.itemsToday.toLocaleString()}</strong>
          </span>
        </div>
        <div>
          <MapPin size={13} />
          <span>
            <small>Coverage</small>
            <strong>{source.region}</strong>
          </span>
        </div>
      </div>
      <div className="source-card__health">
        <span>
          <Activity size={12} /> Health <strong>{source.health}%</strong>
        </span>
        <i>
          <b style={{ width: `${source.health}%` }} />
        </i>
      </div>
    </article>
  );
}
