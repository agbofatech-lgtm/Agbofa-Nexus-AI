import type { DistributionChannel } from "@/types/business";
export function ChannelPriorityBadge({
  priority,
}: {
  priority: DistributionChannel["priority"];
}) {
  return (
    <span className={`channel-priority channel-priority--${priority}`}>
      {priority}
    </span>
  );
}
