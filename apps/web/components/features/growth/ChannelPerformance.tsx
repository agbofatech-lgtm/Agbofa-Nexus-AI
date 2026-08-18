import { BusinessChart } from "@/components/features/business/BusinessChart";
import type { GrowthData } from "@/types/business";
export function ChannelPerformance({
  channels,
}: {
  channels: GrowthData["channelComparison"];
}) {
  return (
    <section className="business-chart-panel glass">
      <div className="business-panel-heading">
        <div>
          <span>CHANNEL COMPARISON</span>
          <h2>Personal vs owned channel performance</h2>
        </div>
      </div>
      <BusinessChart
        data={channels.map((c) => ({
          label: `${c.audience === "personal" ? "Personal" : "Brand"} ${c.channel}`,
          reach: c.reach / 1000,
          registrations: c.registrations,
          subscriptions: c.subscriptions,
        }))}
        label="Demo channel reach, registrations, and subscriptions"
        series={[
          {
            key: "reach",
            label: "Reach (thousands)",
            color: "var(--chart-blue)",
          },
          {
            key: "registrations",
            label: "Registrations",
            color: "var(--chart-gold)",
          },
          {
            key: "subscriptions",
            label: "Subscriptions",
            color: "var(--chart-purple)",
          },
        ]}
        type="bar"
      />
    </section>
  );
}
