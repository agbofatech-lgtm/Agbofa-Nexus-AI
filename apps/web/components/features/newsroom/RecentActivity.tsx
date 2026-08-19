import { ActivityTimeline } from "@/components/shared/operations/ActivityTimeline";
import { formatRelativeTime } from "@/lib/utils/reader";
import type { NewsroomActivity } from "@/types/newsroom";
import type { ActivityEvent } from "@/types/operations";
export function RecentActivity({ activity }: { activity: NewsroomActivity[] }) {
  const events = activity.map<ActivityEvent>((i) => ({
    id: i.id,
    time: formatRelativeTime(i.timestamp),
    title: i.action,
    detail: `${i.subject} — ${i.detail}`,
    status:
      i.type === "verified"
        ? "completed"
        : i.type === "review"
          ? "review"
          : i.type === "source"
            ? "running"
            : i.type === "published"
              ? "waiting"
              : "queued",
    actor: "Newsroom workflow",
  }));
  return (
    <section
      className="recent-activity glass"
      aria-labelledby="recent-activity-title"
    >
      <div className="recent-activity__heading">
        <div>
          <span className="section-kicker">Editorial activity</span>
          <h2 id="recent-activity-title">Recent workflow events</h2>
        </div>
        <span>{activity.length} development events</span>
      </div>
      <ActivityTimeline compact events={events} title="Newsroom activity" />
    </section>
  );
}
