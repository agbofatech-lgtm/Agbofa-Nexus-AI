import { Bot, CheckCircle2, DatabaseZap, FileCheck2, Send } from "lucide-react";

import { formatRelativeTime } from "@/lib/utils/reader";
import type { NewsroomActivity } from "@/types/newsroom";

const activityIcons = {
  verified: CheckCircle2,
  source: DatabaseZap,
  published: Send,
  generated: Bot,
  review: FileCheck2,
} as const;

interface RecentActivityProps {
  activity: NewsroomActivity[];
}

export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <section
      className="recent-activity glass"
      aria-labelledby="recent-activity-title"
    >
      <div className="recent-activity__heading">
        <div>
          <span className="section-kicker">Demo operations</span>
          <h2 id="recent-activity-title">Recent activity</h2>
        </div>
        <span>{activity.length} events</span>
      </div>
      <div className="recent-activity__list">
        {activity.map((item) => {
          const Icon = activityIcons[item.type];
          return (
            <article key={item.id} className="activity-event">
              <span
                className={`activity-event__icon activity-event__icon--${item.type}`}
              >
                <Icon size={15} />
              </span>
              <div>
                <strong>
                  {item.action}: <b>{item.subject}</b>
                </strong>
                <p>{item.detail}</p>
              </div>
              <time dateTime={item.timestamp.toISOString()}>
                {formatRelativeTime(item.timestamp)}
              </time>
            </article>
          );
        })}
      </div>
    </section>
  );
}
