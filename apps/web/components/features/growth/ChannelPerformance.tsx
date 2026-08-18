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
          <span>DEMO DATA · SOURCE SEPARATED</span>
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
          { key: "reach", label: "Reach (thousands)", color: "#3399FF" },
          { key: "registrations", label: "Registrations", color: "#D4AF37" },
          { key: "subscriptions", label: "Subscriptions", color: "#8B5CF6" },
        ]}
        type="bar"
      />
    </section>
  );
}
