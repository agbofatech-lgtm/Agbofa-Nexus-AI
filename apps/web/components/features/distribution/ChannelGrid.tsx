import { ChannelCard } from "@/components/features/distribution/ChannelCard";
import type { DistributionChannel } from "@/types/business";
export function ChannelGrid({ channels }: { channels: DistributionChannel[] }) {
  return (
    <section className="channel-grid" aria-label="Distribution channels">
      {channels.map((channel) => (
        <ChannelCard channel={channel} key={channel.id} />
      ))}
    </section>
  );
}
