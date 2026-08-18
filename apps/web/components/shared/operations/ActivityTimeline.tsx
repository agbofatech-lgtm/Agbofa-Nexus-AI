import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { ActivityEvent, WorkflowStatus } from "@/types/operations";
const icons: Record<WorkflowStatus, typeof Clock3> = {
  queued: Clock3,
  running: LoaderCircle,
  waiting: Clock3,
  review: ShieldCheck,
  completed: CheckCircle2,
  failed: XCircle,
  degraded: AlertTriangle,
  unavailable: Clock3,
};
export function ActivityTimeline({
  title = "Activity",
  events,
  compact = false,
}: {
  title?: string;
  events: readonly ActivityEvent[];
  compact?: boolean;
}) {
  return (
    <section
      className={
        compact
          ? "activity-timeline activity-timeline--compact"
          : "activity-timeline"
      }
      aria-label={title}
    >
      <ol>
        {events.map((e) => {
          const Icon = icons[e.status];
          return (
            <li
              key={e.id}
              className={`activity-timeline__event activity-timeline__event--${e.status}`}
            >
              <time>{e.time}</time>
              <span aria-hidden="true">
                <Icon size={14} />
              </span>
              <div>
                <strong>{e.title}</strong>
                <p>{e.detail}</p>
                {e.actor ? <small>{e.actor}</small> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
