import { BarChart3, MousePointerClick, Users } from "lucide-react";
import { ChannelPriorityBadge } from "@/components/features/distribution/ChannelPriorityBadge";
import { ChannelStatusBadge } from "@/components/features/distribution/ChannelStatusBadge";
import { ChannelTypeBadge } from "@/components/features/distribution/ChannelTypeBadge";
import type { DistributionChannel, DistributionMetric } from "@/types/business";

const metricValue = (metric: DistributionMetric) =>
  metric.value === null ? "—" : metric.value.toLocaleString();
export function ChannelCard({ channel }: { channel: DistributionChannel }) {
  return (
    <article className="channel-card glass-card">
      <div className="channel-card__heading">
        <span>{channel.platform.slice(0, 2).toUpperCase()}</span>
        <div>
          <strong>{channel.platform}</strong>
          <small>{channel.method}</small>
        </div>
        <ChannelStatusBadge status={channel.status} />
      </div>
      <div className="channel-card__labels">
        <ChannelTypeBadge type={channel.type} />
        <ChannelPriorityBadge priority={channel.priority} />
      </div>
      <dl>
        <div>
          <dt>
            <Users size={11} /> Followers
          </dt>
          <dd>{metricValue(channel.followers)}</dd>
        </div>
        <div>
          <dt>
            <BarChart3 size={11} /> Reach
          </dt>
          <dd>{metricValue(channel.reach)}</dd>
        </div>
        <div>
          <dt>
            <MousePointerClick size={11} /> Clicks
          </dt>
          <dd>{metricValue(channel.clicks)}</dd>
        </div>
      </dl>
      <footer>
        <strong>{channel.followers.source}</strong>
        <p>{channel.evidence}</p>
      </footer>
    </article>
  );
}
