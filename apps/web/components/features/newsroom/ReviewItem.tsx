import { Check, Clock3, ShieldCheck, X } from "lucide-react";

import { Badge, Button } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils/reader";
import type {
  ReviewItem as ReviewItemType,
  ReviewStatus,
} from "@/types/newsroom";

interface ReviewItemProps {
  item: ReviewItemType;
  onStatusChange: (id: string, status: ReviewStatus) => void;
}

const badgeStatus = {
  ingested: "queued",
  processing: "running",
  verified: "idle",
  review: "degraded",
  approved: "running",
  rejected: "failed",
  published: "idle",
} as const;

export function ReviewItem({ item, onStatusChange }: ReviewItemProps) {
  return (
    <article className={`review-item review-item--${item.priority}`}>
      <div>
        <Badge status={badgeStatus[item.status]}>{item.status}</Badge>
        <span className={`review-priority review-priority--${item.priority}`}>
          {item.priority}
        </span>
      </div>
      <div className="review-item__story">
        <strong>{item.headline}</strong>
        <span>
          {item.source} · {item.assignee}
        </span>
      </div>
      <span className="review-item__confidence">
        <ShieldCheck size={12} /> {item.confidence}%
      </span>
      <time dateTime={item.timestamp.toISOString()}>
        <Clock3 size={12} /> {formatRelativeTime(item.timestamp)}
      </time>
      <div className="review-item__actions">
        <Button
          aria-label={`Approve ${item.headline}`}
          onClick={() => onStatusChange(item.id, "approved")}
          size="sm"
          variant="ghost"
        >
          <Check size={13} />
        </Button>
        <Button
          aria-label={`Reject ${item.headline}`}
          onClick={() => onStatusChange(item.id, "rejected")}
          size="sm"
          variant="ghost"
        >
          <X size={13} />
        </Button>
      </div>
    </article>
  );
}
