import { DataAuthorityBadge } from "@/components/features/business/DataAuthorityBadge";
import type { ChannelStatus } from "@/types/business";

export function ChannelStatusBadge({ status }: { status: ChannelStatus }) {
  if (status === "not-verified")
    return <DataAuthorityBadge state="not_verified" />;
  if (status === "unavailable" || status === "not-created")
    return <DataAuthorityBadge state="unavailable" />;
  return (
    <span className={`channel-status channel-status--${status}`}>
      ● {status.toUpperCase()}
    </span>
  );
}
