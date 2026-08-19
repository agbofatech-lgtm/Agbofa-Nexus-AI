import { AlertTriangle, Check, Circle, History } from "lucide-react";

import type { Claim, EvidenceStatus } from "@/types/truth";

interface EvidenceTimelineProps {
  claim: Claim;
}

const timelineIcons: Record<EvidenceStatus, typeof Check> = {
  supporting: Check,
  conflicting: AlertTriangle,
  unverified: Circle,
};

export function EvidenceTimeline({ claim }: EvidenceTimelineProps) {
  return (
    <section
      className="evidence-timeline glass"
      aria-labelledby="evidence-timeline-title"
    >
      <div className="truth-panel-heading">
        <div>
          <span className="section-kicker">
            <History size={12} /> Investigation history
          </span>
          <h2 id="evidence-timeline-title">Evidence timeline</h2>
        </div>
      </div>
      <ol>
        {claim.timeline.map((event, index) => {
          const Icon = timelineIcons[event.status];
          return (
            <li
              key={event.id}
              className={`timeline-event timeline-event--${event.status}`}
            >
              <span className="timeline-event__marker">
                <Icon size={13} />
              </span>
              {index < claim.timeline.length - 1 ? <i /> : null}
              <time dateTime={event.date.toISOString()}>
                {new Intl.DateTimeFormat("en", {
                  month: "short",
                  day: "numeric",
                }).format(event.date)}
              </time>
              <strong>{event.title}</strong>
              <p>{event.detail}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
