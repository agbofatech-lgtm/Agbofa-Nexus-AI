import { CircleHelp, Radio, Send, UserRound } from "lucide-react";
import { BusinessMetric } from "@/components/features/business/BusinessMetric";
import type { DistributionChannel } from "@/types/business";
export function DistributionStats({
  channels,
}: {
  channels: DistributionChannel[];
}) {
  const brand = channels.filter((c) => c.type === "brand").length;
  const personal = channels.filter((c) => c.type === "personal").length;
  const verified = channels.filter((c) => c.status === "connected").length;
  return (
    <section className="business-metric-grid">
      <BusinessMetric
        authority="not_verified"
        detail="11 brand + 5 personal"
        icon={Send}
        label="Channels represented"
        value={String(channels.length)}
      />
      <BusinessMetric
        authority="not_verified"
        detail="Repository-verified connections"
        icon={Radio}
        label="Verified connected"
        tone="blue"
        value={String(verified)}
      />
      <BusinessMetric
        authority="demo"
        detail={`${brand} brand surfaces`}
        icon={CircleHelp}
        label="Brand channels"
        tone="purple"
        value={String(brand)}
      />
      <BusinessMetric
        authority="not_verified"
        detail="Manual founder surfaces"
        icon={UserRound}
        label="Personal channels"
        tone="warning"
        value={String(personal)}
      />
    </section>
  );
}
