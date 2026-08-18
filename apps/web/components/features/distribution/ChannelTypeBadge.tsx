import type { ChannelType } from "@/types/business";
export function ChannelTypeBadge({ type }: { type: ChannelType }) {
  return (
    <span className={`channel-type channel-type--${type}`}>
      {type === "personal" ? "MANUAL — FOUNDER CHANNEL" : "BRAND CHANNEL"}
    </span>
  );
}
