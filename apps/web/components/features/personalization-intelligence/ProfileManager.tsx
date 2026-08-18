import { UserRoundCheck } from "lucide-react";

import type { ReaderSegment } from "@/types/personalization-intelligence";

export function ProfileManager({ segments }: { segments: ReaderSegment[] }) {
  return (
    <section className="profile-manager glass">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">
            <UserRoundCheck size={12} /> Demo segments
          </span>
          <h2>Reader profiles</h2>
        </div>
        <span>{segments.length} segments</span>
      </div>
      <div>
        {segments.map((segment) => (
          <article key={segment.id}>
            <div>
              <strong>{segment.name}</strong>
              <span>{segment.primaryInterest}</span>
            </div>
            <dl>
              <div>
                <dt>Readers</dt>
                <dd>{segment.readers.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Completeness</dt>
                <dd>{segment.completeness}%</dd>
              </div>
              <div>
                <dt>Engagement</dt>
                <dd>{segment.engagementRate}%</dd>
              </div>
            </dl>
            <i>
              <b style={{ width: `${segment.completeness}%` }} />
            </i>
          </article>
        ))}
      </div>
    </section>
  );
}
